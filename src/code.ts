// src/code.ts
(function () {
  // Polyfill for btoa: converts a binary string to a base64 encoded string.
  function btoaPolyfill(input: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let output = "";
    for (let i = 0; i < input.length; i += 3) {
      const a = input.charCodeAt(i);
      const b = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
      const c = i + 2 < input.length ? input.charCodeAt(i + 2) : 0;
      const triplet = (a << 16) | (b << 8) | c;
      output += chars[(triplet >> 18) & 0x3F];
      output += chars[(triplet >> 12) & 0x3F];
      output += i + 1 < input.length ? chars[(triplet >> 6) & 0x3F] : "=";
      output += i + 2 < input.length ? chars[triplet & 0x3F] : "=";
    }
    return output;
  }

  // Polyfill for atob: converts a base64 encoded string to a binary string.
  function atobPolyfill(input: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let str = input.replace(/=+$/, "");
    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    let output = "";
    let buffer = 0, bits = 0;
    for (let i = 0; i < str.length; i++) {
      const value = chars.indexOf(str.charAt(i));
      if (value === -1) continue;
      buffer = (buffer << 6) | value;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xFF);
      }
    }
    return output;
  }

  // Global variable to store exported image dimensions (if available)
  let originalImageDimensions: { width: number; height: number } | null = null;

  // Flag to avoid overlapping export calls
  let isExporting = false;

  // Open the UI. Figma loads the external HTML file specified in manifest.json.
  figma.showUI(__html__, { width: 420, height: 550 });
  console.log("🔹 Plugin UI opened");

  // Send initial UI state (no image)
  try {
    figma.ui.postMessage({ type: "no-image" });
  } catch (e) {
    console.error("Error sending initial message to UI:", e);
  }

  // Listen for selection changes
  figma.on("selectionchange", () => {
    console.log("📌 Selection changed");
    updateSelectedImage();
  });

  async function updateSelectedImage() {
    if (isExporting) {
      console.log("Export already in progress; skipping update.");
      return;
    }
    isExporting = true;

    const selection = figma.currentPage.selection;
    console.log("🔎 Current Selection:", selection);

    if (selection.length !== 1) {
      console.log("🚨 No valid exportable image selected (not exactly one node)");
      safePostMessage({ type: "no-image" });
      isExporting = false;
      return;
    }

    const node = selection[0] as SceneNode & ExportMixin & GeometryMixin;
    console.log("✅ Exportable node detected. Node type:", node.type);
    console.log("exportAsync property:", node.exportAsync);
    console.log("Type of exportAsync property:", typeof node.exportAsync);

    if (typeof node.exportAsync !== "function" || !("parent" in node)) {
      console.log("🚨 Node does not implement exportAsync or lacks a parent.");
      safePostMessage({ type: "no-image" });
      isExporting = false;
      return;
    }

    const exportSettings = { format: "PNG", constraint: { type: "SCALE", value: 1 } } as any;
    console.log("Export settings:", exportSettings);

    try {
      console.log("About to call exportAsync on node:", node);
      const imageBytes = (await node.exportAsync(exportSettings)) as Uint8Array;
      console.log("Result of exportAsync call:", imageBytes);
      const base64 = uint8ArrayToBase64(imageBytes);
      console.log("📩 Sending image to UI");
      // Save dimensions if available (fallback if missing)
      originalImageDimensions = { width: (node as any).width || 300, height: (node as any).height || 300 };
      safePostMessage({ type: "load-image", data: base64 });
    } catch (error) {
      console.error("❌ Error exporting image:", error);
      figma.notify("Error exporting image.");
    }
    isExporting = false;
  }

  // Safe postMessage function.
  function safePostMessage(msg: any) {
    try {
      figma.ui.postMessage(msg);
    } catch (e) {
      console.error("Error posting message to UI:", e);
    }
  }

  // Listen for messages from the UI.
  figma.ui.onmessage = function (msg) {
    console.log("📩 Message from UI:", msg);
    if (msg.type === "apply-effect") {
      const imgBytes = base64ToUint8Array(msg.imageData);
      const newImage = figma.createImage(imgBytes);
      // Create a new rectangle node.
      const rect = figma.createRectangle();
      if (originalImageDimensions) {
        rect.resize(originalImageDimensions.width, originalImageDimensions.height);
      } else {
        rect.resize(300, 300);
      }
      rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: newImage.hash }];
      // Position the new rectangle at the center of the viewport.
      rect.x = figma.viewport.center.x - rect.width / 2;
      rect.y = figma.viewport.center.y - rect.height / 2;
      figma.currentPage.appendChild(rect);
      figma.notify("New halftoned image created!");
      // Close the plugin after generating the new image.
      figma.closePlugin();
    }
  };

  // Base64 conversion functions using our polyfills.
  function uint8ArrayToBase64(bytes: Uint8Array): string {
    console.log("Converting Uint8Array to base64 using polyfill.");
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoaPolyfill(binary);
    console.log("Converted base64 string length:", base64.length);
    return base64;
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    console.log("Converting base64 to Uint8Array using polyfill.");
    const binaryStr = atobPolyfill(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
})();

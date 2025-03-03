// src/code.ts
(function () {
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

  let originalImageDimensions: { width: number; height: number } | null = null;
  let isExporting = false;

  figma.showUI(__html__, { width: 420, height: 550 });

  try {
    figma.ui.postMessage({ type: "no-image" });
  } catch (e) {
    console.error("Error sending initial message to UI:", e);
  }

  figma.on("selectionchange", () => {
    updateSelectedImage();
  });

  async function updateSelectedImage() {
    if (isExporting) {
      return;
    }
    isExporting = true;
    const selection = figma.currentPage.selection;

    if (selection.length !== 1) {
      safePostMessage({ type: "no-image" });
      isExporting = false;
      return;
    }

    const node = selection[0] as SceneNode & ExportMixin & GeometryMixin;
    if (typeof node.exportAsync !== "function") {
      safePostMessage({ type: "no-image" });
      isExporting = false;
      return;
    }

    const exportSettings = { format: "PNG", constraint: { type: "SCALE", value: 1 } } as any;

    try {
      const imageBytes = (await node.exportAsync(exportSettings)) as Uint8Array;
      const base64 = uint8ArrayToBase64(imageBytes);
      originalImageDimensions = { width: node.width || 300, height: node.height || 300 };
      safePostMessage({ type: "load-image", data: base64 });
    } catch (error) {
      figma.notify("Error exporting image.");
    }
    isExporting = false;
  }

  function safePostMessage(msg: any) {
    try {
      figma.ui.postMessage(msg);
    } catch (e) {
      console.error("Error posting message to UI:", e);
    }
  }

  figma.ui.onmessage = function (msg) {
    if (msg.type === "apply-effect") {
      const imgBytes = base64ToUint8Array(msg.imageData);
      const newImage = figma.createImage(imgBytes);
      const rect = figma.createRectangle();
      if (originalImageDimensions) {
        rect.resize(originalImageDimensions.width, originalImageDimensions.height);
      } else {
        rect.resize(300, 300);
      }
      rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: newImage.hash }];
      rect.x = figma.viewport.center.x - rect.width / 2;
      rect.y = figma.viewport.center.y - rect.height / 2;
      figma.currentPage.appendChild(rect);
      figma.notify("New image created!");
      figma.closePlugin();
    }
  };

  function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoaPolyfill(binary);
    return base64;
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryStr = atobPolyfill(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
})();

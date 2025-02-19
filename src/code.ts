(function () {
  figma.showUI(__html__, { width: 420, height: 550 });
  console.log("🔹 Plugin UI opened");

  // Show initial UI state (waiting for selection)
  figma.ui.postMessage({ type: "no-image" });

  // Listen for selection changes
  figma.on("selectionchange", () => {
    console.log("📌 Selection changed");
    updateSelectedImage();
  });

  // Function to send the selected image to UI
  async function updateSelectedImage() {
    const selection = figma.currentPage.selection;
    console.log("🔎 Current Selection:", selection);

    if (selection.length === 1 && "fills" in selection[0]) {
      const node = selection[0] as ExportMixin & GeometryMixin;
      console.log("✅ Image detected, exporting...");

      try {
        const imageBytes = await node.exportAsync({ format: "PNG" });
        const base64 = uint8ArrayToBase64(imageBytes);
        console.log("📩 Sending image to UI");
        figma.ui.postMessage({ type: "load-image", data: base64 });
      } catch (error) {
        console.error("❌ Error exporting image:", error);
        figma.notify("Error exporting image.");
      }
    } else {
      console.log("🚨 No valid image selected");
      figma.ui.postMessage({ type: "no-image" });
    }
  }

  // Listen for messages from UI (e.g., apply effect)
  figma.ui.onmessage = function (msg) {
    console.log("📩 Message from UI:", msg);

    if (msg.type === "apply-effect") {
      const imgBytes = base64ToUint8Array(msg.imageData);
      const newImage = figma.createImage(imgBytes);

      const node = figma.currentPage.selection[0] as ExportMixin & GeometryMixin;
      if (node && node.fills && Array.isArray(node.fills)) {
        node.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: newImage.hash }];
        figma.notify("Halftone effect applied!");
      } else {
        figma.notify("This node does not support image fills.");
      }
    }
  };

  // Helper Functions
  function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
})();

"use strict";
(async () => {
    figma.showUI(__html__, { width: 420, height: 550 });
    if (figma.currentPage.selection.length !== 1) {
        figma.notify("Please select an image-filled node.");
        figma.closePlugin();
    }
    const node = figma.currentPage.selection[0];
    if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
        const fills = node.fills;
    }
    else {
        figma.notify("Selected node has no image fills.");
        figma.closePlugin();
    }
    // Process Image AFTER UI Loads
    figma.ui.onmessage = async (msg) => {
        if (msg.type === "ui-ready") {
            await processImage();
        }
        if (msg.type === "apply-effect") {
            const imgBytes = base64ToUint8Array(msg.imageData);
            const newImage = figma.createImage(imgBytes);
            if ("fills" in node) {
                node.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: newImage.hash }];
            }
            else {
                figma.notify("This node does not support image fills.");
            }
            figma.notify("Halftone effect applied!");
            figma.closePlugin();
        }
    };
    // Process Image Function
    async function processImage() {
        try {
            const imageBytes = await node.exportAsync({ format: "PNG" });
            const base64 = uint8ArrayToBase64(imageBytes);
            figma.ui.postMessage({ type: "load-image", data: base64 });
        }
        catch (error) {
            figma.notify("Error exporting image.");
            figma.closePlugin();
        }
    }
    // Helper Functions
    function uint8ArrayToBase64(bytes) {
        let binary = "";
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }
    function base64ToUint8Array(base64) {
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes;
    }
})();

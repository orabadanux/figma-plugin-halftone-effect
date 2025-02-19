import React, { useEffect, useState } from "react";
import "./App.css"; // Optional styling
const App = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [gridSize, setGridSize] = useState(50);
    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(0);
    const [gamma, setGamma] = useState(1);
    const [dithering, setDithering] = useState("none");
    useEffect(() => {
        if (typeof window !== "undefined") {
            // ✅ Notify Figma that the UI is ready
            window.parent.postMessage({ pluginMessage: { type: "ui-ready" } }, "*");
            window.onmessage = (event) => {
                const msg = event.data.pluginMessage;
                if (msg.type === "load-image") {
                    setImageSrc(`data:image/png;base64,${msg.data}`);
                }
            };
        }
    }, []);
    const applyEffect = () => {
        const canvas = (typeof document !== "undefined")
            ? document.getElementById("previewCanvas")
            : null;
        if (!canvas) {
            console.error("Canvas not found.");
            return;
        }
        const dataURL = canvas.toDataURL("image/png").split(",")[1];
        // ✅ Use `window.parent` to send messages to Figma
        window.parent.postMessage({ pluginMessage: { type: "apply-effect", imageData: dataURL } }, "*");
    };
    return (React.createElement("div", { className: "container" },
        React.createElement("h2", null, "Halftone Effect"),
        imageSrc && React.createElement("img", { id: "previewCanvas", src: imageSrc, alt: "Preview" }),
        React.createElement("label", null,
            "Grid Size: ",
            gridSize),
        React.createElement("input", { type: "range", min: "1", max: "100", value: gridSize, onChange: (e) => setGridSize(Number(e.target.value)) }),
        React.createElement("label", null,
            "Brightness: ",
            brightness),
        React.createElement("input", { type: "range", min: "0", max: "100", value: brightness, onChange: (e) => setBrightness(Number(e.target.value)) }),
        React.createElement("label", null,
            "Contrast: ",
            contrast),
        React.createElement("input", { type: "range", min: "-100", max: "100", value: contrast, onChange: (e) => setContrast(Number(e.target.value)) }),
        React.createElement("label", null,
            "Gamma: ",
            gamma),
        React.createElement("input", { type: "range", min: "0.1", max: "5", step: "0.1", value: gamma, onChange: (e) => setGamma(Number(e.target.value)) }),
        React.createElement("label", null, "Dithering:"),
        React.createElement("select", { value: dithering, onChange: (e) => setDithering(e.target.value) },
            React.createElement("option", { value: "none" }, "No Texture"),
            React.createElement("option", { value: "floyd-steinberg" }, "Floyd-Steinberg"),
            React.createElement("option", { value: "ordered" }, "Ordered"),
            React.createElement("option", { value: "noise" }, "Noise")),
        React.createElement("button", { onClick: applyEffect }, "Apply")));
};
export default App;

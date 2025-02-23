import React, { useEffect, useState } from "react";

const styles = {
  container: {
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center" as const,
  },
  placeholder: {
    padding: "20px",
    border: "2px dashed #888",
    borderRadius: "10px",
    background: "#f4f4f4",
    color: "#555",
    fontSize: "16px",
    marginBottom: "20px",
  },
  image: {
    maxWidth: "100%",
    borderRadius: "8px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    border: "none",
    background: "#007bff",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

const App = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(50);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(0);
  const [gamma, setGamma] = useState(1);
  const [dithering, setDithering] = useState("none");

  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      console.log("📩 Message received in UI:", msg);

      if (msg.type === "load-image") {
        setImageSrc(`data:image/png;base64,${msg.data}`);
      } else if (msg.type === "no-image") {
        setImageSrc(null);
      }
    };
  }, []);

  const applyEffect = () => {
    const canvas = document.getElementById("previewCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas not found.");
      return;
    }

    const dataURL = canvas.toDataURL("image/png").split(",")[1];
    parent.postMessage({ pluginMessage: { type: "apply-effect", imageData: dataURL } }, "*");
  };

  return (
    <div style={styles.container}>
      <h2>Halftone Effect</h2>

      {!imageSrc ? (
        <div style={styles.placeholder}>
          <p>📌 Select an image in Figma to start</p>
        </div>
      ) : (
        <img id="previewCanvas" src={imageSrc} alt="Preview" style={styles.image} />
      )}

      <label>Grid Size: {gridSize}</label>
      <input type="range" min="1" max="100" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} />

      <label>Brightness: {brightness}</label>
      <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />

      <label>Contrast: {contrast}</label>
      <input type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />

      <label>Gamma: {gamma}</label>
      <input type="range" min="0.1" max="5" step="0.1" value={gamma} onChange={(e) => setGamma(Number(e.target.value))} />

      <label>Dithering:</label>
      <select value={dithering} onChange={(e) => setDithering(e.target.value)}>
        <option value="none">No Texture</option>
        <option value="floyd-steinberg">Floyd-Steinberg</option>
        <option value="ordered">Ordered</option>
        <option value="noise">Noise</option>
      </select>

      <button style={styles.button} onClick={applyEffect}>Apply</button>
    </div>
  );
};

export default App;

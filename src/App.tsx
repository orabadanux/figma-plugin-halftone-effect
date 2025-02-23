// src/App.tsx
import React, { useEffect, useRef, useState } from "react";

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
  canvas: {
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Listen for messages from plugin code
  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      console.log("📩 Message received in UI:", msg);

      if (msg.type === "load-image") {
        const src = `data:image/png;base64,${msg.data}`;
        setImageSrc(src);
      } else if (msg.type === "no-image") {
        setImageSrc(null);
      }
    };
  }, []);

  // Load the image when imageSrc changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        updatePreview(img);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Re-render the canvas whenever any parameter changes
  useEffect(() => {
    if (originalImage) {
      updatePreview(originalImage);
    }
  }, [gridSize, brightness, contrast, gamma, dithering, originalImage]);

  const updatePreview = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match the image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image to get pixel data
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Clear the canvas to draw the halftone effect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cellSize = gridSize;
    const maxRadius = cellSize / 2;

    // Loop over grid cells
    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        let totalBrightness = 0;
        let count = 0;
        for (let j = 0; j < cellSize; j++) {
          for (let i = 0; i < cellSize; i++) {
            if (x + i < canvas.width && y + j < canvas.height) {
              const index = ((y + j) * canvas.width + (x + i)) * 4;
              const r = imageData.data[index];
              const g = imageData.data[index + 1];
              const b = imageData.data[index + 2];
              // Calculate luminance (you can later incorporate brightness/contrast adjustments)
              const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              totalBrightness += lum;
              count++;
            }
          }
        }
        const avgBrightness = totalBrightness / count;
        // Invert brightness so dark areas produce larger circles
        const radius = maxRadius * (1 - avgBrightness / 255);

        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
      }
    }
  };

  const applyEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found.");
      return;
    }
    // Get the processed image data from the canvas
    const dataURL = canvas.toDataURL("image/png").split(",")[1];
    parent.postMessage(
      { pluginMessage: { type: "apply-effect", imageData: dataURL } },
      "*"
    );
  };

  return (
    <div style={styles.container}>
      <h2>Halftone Effect</h2>
      {!imageSrc ? (
        <div style={styles.placeholder}>
          <p>📌 Select an image in Figma to start</p>
        </div>
      ) : (
        <canvas ref={canvasRef} style={styles.canvas} />
      )}
      <div>
        <label>Grid Size: {gridSize}</label>
        <input
          type="range"
          min="1"
          max="100"
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Brightness: {brightness}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Contrast: {contrast}</label>
        <input
          type="range"
          min="-100"
          max="100"
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Gamma: {gamma}</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
        />
      </div>
      <div>
        <label>Dithering:</label>
        <select value={dithering} onChange={(e) => setDithering(e.target.value)}>
          <option value="none">No Texture</option>
          <option value="floyd-steinberg">Floyd-Steinberg</option>
          <option value="ordered">Ordered</option>
          <option value="noise">Noise</option>
        </select>
      </div>
      <button style={styles.button} onClick={applyEffect}>
        Apply
      </button>
    </div>
  );
};

export default App;

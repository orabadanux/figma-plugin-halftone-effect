import React, { useEffect, useRef, useState } from "react";

const styles = {
  container: {
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center" as const,
  },
  canvas: {
    border: "1px solid #ddd",
    maxWidth: "100%",
    marginBottom: "10px",
  },
  sliderContainer: {
    margin: "10px 0",
  },
  slider: {
    width: "80%",
  },
  button: {
    marginTop: "10px",
    padding: "8px 16px",
    fontSize: "16px",
  },
};

const App = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(10);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [gamma, setGamma] = useState(1);
  const [dithering, setDithering] = useState("none");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Listen for messages from the plugin main code.
  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "load-image") {
        setImageSrc(`data:image/png;base64,${msg.data}`);
      } else if (msg.type === "no-image") {
        setImageSrc(null);
      }
    };
  }, []);

  // When imageSrc updates, load the image and draw it.
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        updateCanvas();
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Update canvas when any parameter changes.
  useEffect(() => {
    if (imageRef.current) {
      updateCanvas();
    }
  }, [gridSize, brightness, contrast, gamma, dithering]);

  const updateCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageRef.current) return;

    // Set canvas dimensions to match the image.
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;

    // Draw the original image.
    ctx.drawImage(imageRef.current, 0, 0);

    // Get the image data.
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Clear the canvas for drawing the halftone effect.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through the image in cells.
    const cellSize = gridSize;
    const maxRadius = cellSize / 2;
    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        let totalLuminance = 0;
        let count = 0;
        // Loop through each cell's pixels.
        for (let j = 0; j < cellSize; j++) {
          for (let i = 0; i < cellSize; i++) {
            const px = x + i;
            const py = y + j;
            if (px < canvas.width && py < canvas.height) {
              const index = (py * canvas.width + px) * 4;
              const r = imgData.data[index];
              const g = imgData.data[index + 1];
              const b = imgData.data[index + 2];
              // Compute luminance using standard weights.
              const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              totalLuminance += lum;
              count++;
            }
          }
        }
        const avgLuminance = totalLuminance / count;
        // Invert luminance so that darker areas produce larger dots.
        const radius = maxRadius * (1 - avgLuminance / 255);

        // Draw the circle for the halftone effect.
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
      }
    }
  };

  const applyEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export the current canvas as a PNG (without header) and send it to the plugin.
    const dataURL = canvas.toDataURL("image/png").split(",")[1];
    parent.postMessage({ pluginMessage: { type: "apply-effect", imageData: dataURL } }, "*");
  };

  return (
    <div style={styles.container}>
      <h2>Halftone Effect Plugin UI</h2>
      {!imageSrc ? (
        <div>No image selected</div>
      ) : (
        <>
          <canvas ref={canvasRef} style={styles.canvas} />
          <div style={styles.sliderContainer}>
            <label>Grid Size: {gridSize}</label>
            <br />
            <input
              type="range"
              min="1"
              max="100"
              value={gridSize}
              style={styles.slider}
              onChange={(e) => setGridSize(Number(e.target.value))}
            />
          </div>
          <div style={styles.sliderContainer}>
            <label>Brightness: {brightness}</label>
            <br />
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              style={styles.slider}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </div>
          <div style={styles.sliderContainer}>
            <label>Contrast: {contrast}</label>
            <br />
            <input
              type="range"
              min="0"
              max="100"
              value={contrast}
              style={styles.slider}
              onChange={(e) => setContrast(Number(e.target.value))}
            />
          </div>
          <div style={styles.sliderContainer}>
            <label>Gamma: {gamma}</label>
            <br />
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={gamma}
              style={styles.slider}
              onChange={(e) => setGamma(Number(e.target.value))}
            />
          </div>
          <div style={styles.sliderContainer}>
            <label>Dithering: </label>
            <br />
            <select value={dithering} onChange={(e) => setDithering(e.target.value)}>
              <option value="none">None</option>
              <option value="floyd-steinberg">Floyd-Steinberg</option>
              <option value="ordered">Ordered</option>
              <option value="noise">Noise</option>
            </select>
          </div>
          <button style={styles.button} onClick={applyEffect}>
            Generate
          </button>
        </>
      )}
    </div>
  );
};

export default App;

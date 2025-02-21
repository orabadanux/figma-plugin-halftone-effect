import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";  // ✅ Ensure CSS is bundled
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

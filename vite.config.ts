import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const isPluginBuild = process.env.BUILD_TARGET === "plugin";

export default defineConfig({
  base: './',  // Use relative paths for assets
  plugins: isPluginBuild ? [] : [react()],
  build: {
    target: "chrome58", // Transpile code to a version compatible with Figma's runtime
    outDir: isPluginBuild ? "dist/plugin" : "dist/ui",
    emptyOutDir: isPluginBuild, // Clears dist/plugin only when building plugin
    lib: isPluginBuild
      ? {
          entry: resolve(__dirname, "src/code.ts"),
          name: "FigmaPlugin",
          fileName: () => "code.js",
          formats: ["iife"],
        }
      : undefined,
    rollupOptions: isPluginBuild
      ? {
          output: {
            format: "iife",
            name: "FigmaPlugin",
          },
        }
      : {
          input: resolve(__dirname, "index.html"),
          output: {
            entryFileNames: "ui.js", // Forces the UI JS file to be named "ui.js"
          },
        },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const isPluginBuild = process.env.BUILD_TARGET === "plugin";

export default defineConfig({
  plugins: isPluginBuild ? [] : [react()], // ✅ Include React plugin for UI
  build: {
    outDir: isPluginBuild ? "dist/plugin" : "dist/ui",
    emptyOutDir: isPluginBuild, // ✅ Only clear when building the plugin
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
          input: resolve(__dirname, "index.html"), // ✅ Entry point for UI build
        },
  },
});

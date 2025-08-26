import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const isPluginBuild = process.env.BUILD_TARGET === "plugin";

export default defineConfig({
  base: "./",
  plugins: isPluginBuild ? [] : [react()],
  publicDir: isPluginBuild ? false : false,     // no /public for UI (optional)
  build: {
    target: "chrome58",
    outDir: isPluginBuild ? "dist/plugin" : "dist/ui",
    emptyOutDir: isPluginBuild,
    assetsInlineLimit: isPluginBuild ? 0 : 250_000, // 🔴 inline UI assets as data: URIs
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
          output: { format: "iife", name: "FigmaPlugin" },
        }
      : {
          input: resolve(__dirname, "index.html"),
          output: { entryFileNames: "ui.js" },
        },
  },
});

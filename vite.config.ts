import { defineConfig } from "vite";
import { resolve } from "path";

const isPluginBuild = process.env.BUILD_TARGET === "plugin";

export default defineConfig({
  build: {
    outDir: isPluginBuild ? "dist/plugin" : "dist/ui",
    emptyOutDir: false, // ✅ Prevents UI build from being deleted
    lib: isPluginBuild
      ? {
          entry: resolve(__dirname, "src/code.ts"),
          name: "FigmaPlugin",
          fileName: () => "code.js", // ✅ Output should be "code.js"
          formats: ["iife"], // ✅ Ensures Figma runs this properly
        }
      : undefined,
    rollupOptions: isPluginBuild
      ? {
          output: {
            format: "iife", // ✅ Forces correct wrapping for Figma
            name: "FigmaPlugin",
          },
        }
      : {
          input: resolve(__dirname, "index.html"),
          output: {
            format: "es",
          },
        },
  },
});

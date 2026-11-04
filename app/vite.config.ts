import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Base is relative so the build works at any GitHub Pages project path.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    // Ship ArcGIS + Calcite assets with the app so the demo has no runtime
    // dependency on js.arcgis.com for SDK assets (workers, styles, icons).
    viteStaticCopy({
      targets: [
        { src: "node_modules/@arcgis/core/assets/*", dest: "arcgis-assets" },
        {
          src: "node_modules/@esri/calcite-components/dist/cdn/assets/*",
          dest: "calcite-assets",
        },
      ],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 4000,
  },
});

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  build: { target: "esnext" },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    watch: {
      ignored: [
        "**/public/baby-gru/**",
        "**/public/moorhen-embed/**",
        "**/public/**.wasm",
        "**/public/**.data",
      ],
    },
  },
  resolve: { tsconfigPaths: true },
});
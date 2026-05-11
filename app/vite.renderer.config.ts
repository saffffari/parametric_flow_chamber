import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Pin the dep-scanner to just the renderer entry. Without this, Vite picks
  // up stray HTML files inside electron-forge's packaged output (out/...
  // /LICENSES.chromium.html) and the dep-scan crashes with "server is being
  // restarted or closed". Explicit entry = scoped scan = no surprises.
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    fs: {
      deny: ["out/**", ".vite/**"],
    },
  },
});

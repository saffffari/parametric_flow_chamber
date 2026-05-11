import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["electron", "serialport", "fs-extra", "electron-store"],
    },
  },
});

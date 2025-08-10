import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Used in development
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "../dist", // Sends built files to root/dist for easy deploy
    emptyOutDir: true
  }
});

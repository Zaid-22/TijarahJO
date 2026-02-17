import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const isSignalrPureAnnotationWarning =
          warning.code === "INVALID_ANNOTATION" &&
          typeof warning.id === "string" &&
          warning.id.includes("@microsoft/signalr/dist/esm/Utils.js");

        if (isSignalrPureAnnotationWarning) {
          return;
        }

        warn(warning);
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      // Prevent full page reloads on HMR errors
      overlay: true,
    },
  },
  // Optimize HMR to prevent unnecessary reloads
  optimizeDeps: {
    exclude: [],
  },
});

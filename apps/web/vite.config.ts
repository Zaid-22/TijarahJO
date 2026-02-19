import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("/node_modules/")) {
            return undefined;
          }

          if (normalizedId.includes("/node_modules/@microsoft/signalr/")) {
            return "signalr-vendor";
          }

          if (normalizedId.includes("/node_modules/framer-motion/")) {
            return "motion-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react-router/") ||
            normalizedId.includes("/node_modules/react-router-dom/") ||
            normalizedId.includes("/node_modules/@remix-run/router/")
          ) {
            return "router-vendor";
          }

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/scheduler/")
          ) {
            return "react-vendor";
          }

          if (normalizedId.includes("/node_modules/lucide-react/")) {
            return "icons-vendor";
          }

          if (normalizedId.includes("/node_modules/sonner/")) {
            return "sonner-vendor";
          }

          if (
            normalizedId.includes("/node_modules/class-variance-authority/") ||
            normalizedId.includes("/node_modules/clsx/") ||
            normalizedId.includes("/node_modules/tailwind-merge/")
          ) {
            return "ui-utils-vendor";
          }

          return undefined;
        },
      },
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

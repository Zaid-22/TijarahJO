import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
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
})


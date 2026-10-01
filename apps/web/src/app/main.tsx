/// <reference types="vite/client" />
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "../contexts/AuthContext";
import { serverQueryClient } from "../shared/query/queryClient";
import { ErrorBoundary } from "../shared/ui/error-boundary";
import { purgeLegacySensitiveRuntimeCaches } from "../shared/pwa/cacheHygiene";
import App from "./App";
import "../styles/globals.css";

// Global safety net for dynamic import/chunk loading failures.
// This typically happens when a new version of the app is deployed and old chunks are removed from the server.
if (typeof window !== "undefined") {
  const handleChunkError = (message?: string) => {
    const errorMsg = message || "";
    const isChunkFailed =
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("Expected a JavaScript-or-Wasm module script") ||
      errorMsg.includes("Failed to load module script") ||
      errorMsg.includes("ChunkLoadError");

    if (isChunkFailed) {
      const lastReload = localStorage.getItem("last-chunk-reload");
      const now = Date.now();
      // Only reload if we haven't reloaded in the last 10 seconds to prevent infinite reload loops
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        localStorage.setItem("last-chunk-reload", now.toString());
        window.location.reload();
      }
    }
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason) {
      const message = event.reason.message || String(event.reason);
      handleChunkError(message);
    }
  });

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        target.tagName === "SCRIPT" &&
        ((target as HTMLScriptElement).src || "").includes("/assets/")
      ) {
        handleChunkError("Failed to load module script");
      }
    },
    true // Capture phase to intercept script loading errors
  );
}
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const rootContainer = rootElement;

const appTree = (
  <ErrorBoundary>
    <QueryClientProvider client={serverQueryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-center" richColors expand={true} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

async function bootstrap() {
  await purgeLegacySensitiveRuntimeCaches();

  ReactDOM.createRoot(rootContainer).render(appTree);
}

void bootstrap();

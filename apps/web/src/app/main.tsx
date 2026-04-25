/// <reference types="vite/client" />
import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { serverQueryClient } from "../shared/query/queryClient";
import { ErrorBoundary } from "../shared/ui/error-boundary";
import App from "./App";
import "../styles/globals.css";

function normalizePathname(pathname: string): string {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "");
  return normalized || "/";
}

const shouldWarmInitialHomeRoute =
  typeof window !== "undefined" &&
  normalizePathname(window.location.pathname) === "/";

if (shouldWarmInitialHomeRoute) {
  void import("../features/home/pages/HomePage");
  void import("../features/home/components/HomeDeferredSections");
}

const Toaster = lazy(() =>
  import("../shared/ui/sonner").then((m) => ({ default: m.Toaster })),
);

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
          <Suspense fallback={null}>
            <Toaster position="top-center" richColors expand={true} />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

async function bootstrap() {
  if (shouldWarmInitialHomeRoute) {
    await Promise.all([
      import("../features/home/pages/HomePage"),
      import("../features/home/components/HomeDeferredSections"),
    ]);
  }

  ReactDOM.createRoot(rootContainer).render(appTree);
}

void bootstrap();

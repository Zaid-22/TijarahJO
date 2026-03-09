import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const DEV_DEFAULT_API_BASE_URL = "http://localhost:5033/api";
const PROD_DEFAULT_API_BASE_URL = "/api";

function parseApiOrigin(apiBaseUrl: string): string | null {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return null;
  }
}

function isLocalhostHost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function normalizeOriginSource(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsed = new URL(trimmedValue);
    if (!["http:", "https:", "ws:", "wss:"].includes(parsed.protocol)) {
      return null;
    }

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function parseSpaceDelimitedOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((entry) => normalizeOriginSource(entry))
    .filter((entry): entry is string => entry !== null);
}

function toSocketOrigin(origin: string, isProduction: boolean): string | null {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === "https:") {
      return `wss://${parsed.host}`;
    }
    if (
      parsed.protocol === "http:" &&
      (!isProduction || isLocalhostHost(parsed.hostname))
    ) {
      return `ws://${parsed.host}`;
    }
  } catch {
    return null;
  }

  return null;
}

function buildConnectSources(isProduction: boolean): string {
  const defaultApiBaseUrl = isProduction
    ? PROD_DEFAULT_API_BASE_URL
    : DEV_DEFAULT_API_BASE_URL;
  const configuredApiBaseUrl =
    process.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl;
  const apiOrigin = parseApiOrigin(configuredApiBaseUrl);
  const shouldApplyProdExtras =
    process.env.VITE_CSP_ALLOW_PROD_CONNECT_SRC_EXTRA === "1";
  const extraOrigins = parseSpaceDelimitedOrigins(
    process.env.VITE_CSP_CONNECT_SRC_EXTRA,
  );

  const connectSources = new Set<string>(["'self'"]);
  if (!isProduction) {
    connectSources.add("ws:");
    connectSources.add("wss:");
  }
  if (apiOrigin) {
    connectSources.add(apiOrigin);
    const socketOrigin = toSocketOrigin(apiOrigin, isProduction);
    if (socketOrigin) {
      connectSources.add(socketOrigin);
    }
  }
  if (isProduction && !shouldApplyProdExtras) {
    return `connect-src ${Array.from(connectSources).join(" ")}`;
  }

  extraOrigins.forEach((origin) => {
    connectSources.add(origin);
  });

  return `connect-src ${Array.from(connectSources).join(" ")}`;
}

function buildStyleSrcDirective(isProduction: boolean): string {
  if (isProduction) {
    return "style-src 'self' https://fonts.googleapis.com";
  }

  return "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
}

function buildCspPolicy(isProduction: boolean): string {
  const connectSrc = buildConnectSources(isProduction);
  const styleSrc = buildStyleSrcDirective(isProduction);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    styleSrc,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    connectSrc,
    "form-action 'self'",
  ].join("; ");
}

function injectCspPolicy(mode: string) {
  const cspPolicy = buildCspPolicy(mode === "production");

  return {
    name: "inject-csp-policy",
    transformIndexHtml(html: string) {
      return html.replace("__CSP_POLICY__", cspPolicy);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react(), injectCspPolicy(mode)],
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

          if (normalizedId.includes("/node_modules/@tanstack/")) {
            return "query-vendor";
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
    host: "127.0.0.1",
    port: 5173,
    // open: true, // commented out to prevent dev server from hanging
    hmr: {
      // Prevent full page reloads on HMR errors
      overlay: true,
    },
  },
  // Optimize HMR to prevent unnecessary reloads
  optimizeDeps: {
    exclude: [],
  },
}));

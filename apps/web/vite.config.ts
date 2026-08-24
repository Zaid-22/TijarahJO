import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const DEV_DEFAULT_API_BASE_URL = "http://localhost:5033/api/v1";
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

function addLoopbackOriginAliases(target: Set<string>, origin: string): void {
  try {
    const parsed = new URL(origin);
    if (!isLocalhostHost(parsed.hostname)) {
      return;
    }

    const portSuffix = parsed.port ? `:${parsed.port}` : "";
    // CSP host-source syntax does not accept bracketed IPv6 loopback literals,
    // so keep development aliases to the loopback forms browsers parse here.
    for (const hostname of ["localhost", "127.0.0.1"]) {
      target.add(`${parsed.protocol}//${hostname}${portSuffix}`);
    }
  } catch {
    // Ignore malformed origins so CSP generation never breaks the build.
  }
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
  connectSources.add("https://maps.googleapis.com");
  connectSources.add("https://maps.gstatic.com");
  connectSources.add("https://routes.googleapis.com");
  if (apiOrigin) {
    connectSources.add(apiOrigin);
    addLoopbackOriginAliases(connectSources, apiOrigin);
    const socketOrigin = toSocketOrigin(apiOrigin, isProduction);
    if (socketOrigin) {
      connectSources.add(socketOrigin);
      addLoopbackOriginAliases(connectSources, socketOrigin);
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
    return "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
  }

  return "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
}

function buildScriptSrcDirective(): string {
  return [
    "script-src",
    "'self'",
    "'sha256-SLOKmWvKYj1okn6TfCw3PMmRTrhS4oK78YwwL9JigrM='",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
  ].join(" ");
}

function buildFrameSrcDirective(): string {
  return "frame-src 'self' https://www.google.com https://www.youtube-nocookie.com";
}

function buildImgSrcDirective(isProduction: boolean): string {
  const imgSources = new Set<string>(["'self'", "data:", "blob:", "https:"]);

  // In development, also allow the backend origin for serving uploaded images
  if (!isProduction) {
    const defaultApiBaseUrl = DEV_DEFAULT_API_BASE_URL;
    const configuredApiBaseUrl =
      process.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl;
    const apiOrigin = parseApiOrigin(configuredApiBaseUrl);
    if (apiOrigin) {
      imgSources.add(apiOrigin);
      addLoopbackOriginAliases(imgSources, apiOrigin);
    }
  }

  return `img-src ${Array.from(imgSources).join(" ")}`;
}

function buildCspPolicy(isProduction: boolean): string {
  const connectSrc = buildConnectSources(isProduction);
  const styleSrc = buildStyleSrcDirective(isProduction);
  const scriptSrc = buildScriptSrcDirective();
  const frameSrc = buildFrameSrcDirective();
  const imgSrc = buildImgSrcDirective(isProduction);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    scriptSrc,
    styleSrc,
    imgSrc,
    "font-src 'self' data: https://fonts.gstatic.com",
    connectSrc,
    frameSrc,
    "worker-src 'self'",
    "form-action 'self'",
  ].join("; ");
}

function injectCspPolicy(mode: string, env: Record<string, string>) {
  Object.assign(process.env, env);
  const cspPolicy = buildCspPolicy(mode === "production");

  return {
    name: "inject-csp-policy",
    transformIndexHtml(html: string) {
      if (mode !== "production") {
        return html.replace(
          `    <meta http-equiv="Content-Security-Policy" content="__CSP_POLICY__" />
`,
          ""
        );
      }

      return html.replace("__CSP_POLICY__", cspPolicy);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icons/*.png"],
        manifest: {
          name: "TijarahJO — سوق الأردن",
          short_name: "TijarahJO",
          description:
            "Jordan's trusted marketplace for buying and selling new and used items.",
          theme_color: "#0A4ABF",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          dir: "rtl",
          lang: "ar",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Precache only the installable app shell. Route chunks are cached on
          // first use below instead of making every deploy download the whole app.
          globPatterns: [
            "index.html",
            "assets/app-shell-*.js",
            "assets/index-*.css",
            "assets/react-vendor-*.js",
            "assets/router-vendor-*.js",
            "assets/query-vendor-*.js",
            "assets/ui-utils-vendor-*.js",
            "assets/icons-vendor-*.js",
          ],
          importScripts: ["notifications-sw.js"],
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api\//, /^\/chatHub/, /^\/uploads\//],
          runtimeCaching: [
            {
              urlPattern: ({ request, sameOrigin, url }) =>
                sameOrigin &&
                url.pathname.startsWith("/assets/") &&
                (request.destination === "script" ||
                  request.destination === "style"),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "route-assets-v1",
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: /\/uploads\/(?:post-images|user-avatars|category-images)\//,
              handler: "CacheFirst",
              options: {
                cacheName: "public-image-cache-v2",
                expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "unsplash-images",
                expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
      injectCspPolicy(mode, env),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        sonner: path.resolve(__dirname, "src/shared/ui/sonner.tsx"),
      },
    },
    build: {
      manifest: true,
      modulePreload: {
        resolveDependencies(_filename, deps, context) {
          if (context.hostType !== "html") {
            return deps;
          }

          // Keep chart code deferred until the admin dashboard requests it.
          return deps.filter(
            (dep) =>
              !dep.includes("recharts-vendor-") &&
              !dep.includes("victory-vendor-"),
          );
        },
      },
      rollupOptions: {
        output: {
          entryFileNames: "assets/app-shell-[hash].js",
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, "/");

            if (!normalizedId.includes("/node_modules/")) {
              return undefined;
            }

            if (normalizedId.includes("/node_modules/@microsoft/signalr/")) {
              return "signalr-vendor";
            }

            if (normalizedId.includes("/node_modules/recharts/")) {
              return "recharts-vendor";
            }

            if (normalizedId.includes("/node_modules/victory-vendor/")) {
              return "victory-vendor";
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
              normalizedId.includes(
                "/node_modules/class-variance-authority/",
              ) ||
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
    server: {
      host: "localhost",
      port: 5173,
      headers: {
        // Prevent browsers from holding onto stale optimized dependency chunks
        // across dev-server restarts, which can surface as 404s under
        // /node_modules/.vite/deps and then cascade into lazy import failures.
        "Cache-Control": "no-store",
        "Content-Security-Policy": "frame-ancestors 'none';",
      },
      proxy: {
        // Forward uploaded-file requests to the backend so images
        // (post, chat, avatar, report evidence) resolve correctly in dev.
        "/uploads": {
          target:
            env.VITE_API_BASE_URL?.trim()
              ? parseApiOrigin(env.VITE_API_BASE_URL.trim()) ??
                "http://localhost:5033"
              : "http://localhost:5033",
          changeOrigin: true,
        },
      },
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
  };
});

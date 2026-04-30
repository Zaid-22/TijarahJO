type RuntimeEnv = Record<string, unknown>;

type GlobalWithRuntimeEnv = typeof globalThis & {
  __APP_RUNTIME_ENV__?: RuntimeEnv;
};

function resolveRuntimeEnv(): RuntimeEnv {
  // Browser entrypoint copies Vite env onto a runtime global before app code loads.
  const runtimeEnv = (globalThis as GlobalWithRuntimeEnv).__APP_RUNTIME_ENV__;
  if (runtimeEnv) {
    return runtimeEnv;
  }

  const nodeProcess = (globalThis as typeof globalThis & {
    process?: { env?: RuntimeEnv };
  }).process;
  if (nodeProcess?.env) {
    return nodeProcess.env;
  }

  return {};
}

const env = resolveRuntimeEnv();

function parsePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanFlag(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeLocalLoopbackUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "::1") {
      // Keep local auth and API cookies on a single loopback host in dev.
      parsed.hostname = "localhost";
    }

    return parsed.toString();
  } catch {
    return value;
  }
}

export function normalizeApiBaseUrl(value: string): string {
  const normalized = value.replace(/\/+$/, "");
  const normalizedLoopbackUrl = normalizeLocalLoopbackUrl(normalized);

  // Backward-compatible guard: older env templates used `/api` without version.
  if (/\/api$/i.test(normalizedLoopbackUrl)) {
    return `${normalizedLoopbackUrl}/v1`;
  }

  return normalizedLoopbackUrl;
}

const configuredApiBaseUrl = normalizeApiBaseUrl(
  parseNonEmptyString(
    env.VITE_API_BASE_URL,
    "http://localhost:5033/api/v1",
  ),
);

const backendHostUrl = configuredApiBaseUrl.replace(/\/api(?:\/v\d+)?$/i, "");
const isDevMode = parseBooleanFlag(env.DEV, false);

export const APP_CONFIG = {
  apiBaseUrl: configuredApiBaseUrl,
  backendHostUrl,
  googleAuthEnabled: parseBooleanFlag(env.VITE_GOOGLE_AUTH_ENABLED, false),
  googleMapsApiKey: parseNonEmptyString(env.VITE_GOOGLE_MAPS_API_KEY, ""),
  googleMapsMapId: parseNonEmptyString(
    env.VITE_GOOGLE_MAPS_MAP_ID,
    isDevMode ? "DEMO_MAP_ID" : "",
  ),
  backendRunCommand:
    "cd apps/api/src/Api && dotnet run",
  requestTimeoutMs: parsePositiveNumber(env.VITE_REQUEST_TIMEOUT_MS, 10_000),
  defaultCity: parseNonEmptyString(env.VITE_DEFAULT_CITY, "Amman"),
  defaultPhonePrefix: parseNonEmptyString(env.VITE_DEFAULT_PHONE_PREFIX, "+962"),
  search: {
    allPostsLimit: parsePositiveNumber(env.VITE_ALL_POSTS_SEARCH_LIMIT, 200),
    homeLimit: parsePositiveNumber(env.VITE_HOME_SEARCH_LIMIT, 200),
    searchResultsLimit: parsePositiveNumber(env.VITE_SEARCH_RESULTS_LIMIT, 100),
  },
} as const;

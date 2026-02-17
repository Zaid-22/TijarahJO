const env = (import.meta as any).env ?? {};

function parsePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

const configuredApiBaseUrl = parseNonEmptyString(
  env.VITE_API_BASE_URL,
  "http://localhost:5033/api",
).replace(/\/+$/, "");

const backendHostUrl = configuredApiBaseUrl.endsWith("/api")
  ? configuredApiBaseUrl.slice(0, -4)
  : configuredApiBaseUrl;

export const APP_CONFIG = {
  apiBaseUrl: configuredApiBaseUrl,
  backendHostUrl,
  backendRunCommand:
    "cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI && dotnet run",
  requestTimeoutMs: parsePositiveNumber(env.VITE_REQUEST_TIMEOUT_MS, 10_000),
  defaultCity: parseNonEmptyString(env.VITE_DEFAULT_CITY, "Amman"),
  defaultPhonePrefix: parseNonEmptyString(env.VITE_DEFAULT_PHONE_PREFIX, "+962"),
  search: {
    allProductsLimit: parsePositiveNumber(env.VITE_ALL_PRODUCTS_SEARCH_LIMIT, 200),
    homeLimit: parsePositiveNumber(env.VITE_HOME_SEARCH_LIMIT, 200),
    searchResultsLimit: parsePositiveNumber(env.VITE_SEARCH_RESULTS_LIMIT, 100),
  },
} as const;

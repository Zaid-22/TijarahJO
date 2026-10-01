/**
 * Recursively converts all object keys from PascalCase to camelCase.
 * The backend uses `PropertyNamingPolicy = null` which preserves PascalCase,
 * but the frontend types expect camelCase.
 */
export function toCamelCaseKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCaseKeys(item)) as T;
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = toCamelCaseKeys(value);
    }
    return result as T;
  }
  return obj as T;
}

/**
 * Resolves an upload path to a URL the browser can fetch.
 *
 * The backend stores relative paths (e.g. /uploads/reports/abc.jpg).
 * In development the Vite proxy forwards /uploads → backend, so the
 * relative path works directly. In production, if the frontend and API
 * are on different origins, set VITE_API_BASE_URL to the API origin
 * (e.g. https://api.tijarah.jo) and this function will prefix it.
 */
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Already absolute — return as-is (backwards compat with any old records).
  if (/^https?:\/\//i.test(url)) return url;

  // If a cross-origin API base is configured, prefix it to the relative path.
  const apiBase = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL;
  if (apiBase) {
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
    } catch {
      // Invalid URL in env var — fall through to relative.
    }
  }

  // Relative path — works via Vite proxy in dev and same-origin serving in prod.
  return url;
}

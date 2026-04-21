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

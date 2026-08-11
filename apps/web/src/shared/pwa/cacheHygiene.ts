const LEGACY_SENSITIVE_CACHE_NAMES = ["image-cache"] as const;

type CacheDeletionApi = Pick<CacheStorage, "delete">;

export async function purgeLegacySensitiveRuntimeCaches(
  cacheStorage?: CacheDeletionApi,
): Promise<string[]> {
  const resolvedCacheStorage =
    cacheStorage ??
    (typeof globalThis !== "undefined" && "caches" in globalThis
      ? globalThis.caches
      : undefined);

  if (!resolvedCacheStorage) {
    return [];
  }

  const deletionResults = await Promise.allSettled(
    LEGACY_SENSITIVE_CACHE_NAMES.map(async (cacheName) => ({
      cacheName,
      deleted: await resolvedCacheStorage.delete(cacheName),
    })),
  );

  return deletionResults.flatMap((result) =>
    result.status === "fulfilled" && result.value.deleted
      ? [result.value.cacheName]
      : [],
  );
}

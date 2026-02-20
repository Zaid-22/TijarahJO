import { useCallback, useEffect, useMemo, useState } from "react";

type ServerQueryEntry<TData = unknown> = {
  data?: TData;
  error: string | null;
  updatedAt: number;
  lastAccessedAt: number;
  isFetching: boolean;
  inFlight?: Promise<TData>;
  listeners: Set<() => void>;
};

type UseServerQueryOptions<TData> = {
  key: string;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  staleTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  initialData?: TData;
};

type UseServerQueryResult<TData> = {
  data?: TData;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<TData | undefined>;
};

const serverQueryCache = new Map<string, ServerQueryEntry<unknown>>();
const MAX_SERVER_QUERY_CACHE_ENTRIES = 150;
const SERVER_QUERY_IDLE_TTL_MS = 5 * 60_000;

function markEntryAccess(entry: ServerQueryEntry<unknown>) {
  entry.lastAccessedAt = Date.now();
}

function pruneServerQueryCache() {
  const now = Date.now();

  for (const [key, entry] of serverQueryCache.entries()) {
    const isIdle = now - entry.lastAccessedAt > SERVER_QUERY_IDLE_TTL_MS;
    const hasSubscribers = entry.listeners.size > 0;

    if (isIdle && !hasSubscribers && !entry.isFetching && !entry.inFlight) {
      serverQueryCache.delete(key);
    }
  }

  if (serverQueryCache.size <= MAX_SERVER_QUERY_CACHE_ENTRIES) {
    return;
  }

  const evictableEntries = Array.from(serverQueryCache.entries())
    .filter(([, entry]) => entry.listeners.size === 0 && !entry.isFetching && !entry.inFlight)
    .sort(([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt);

  for (const [key] of evictableEntries) {
    if (serverQueryCache.size <= MAX_SERVER_QUERY_CACHE_ENTRIES) {
      break;
    }
    serverQueryCache.delete(key);
  }
}

function getEntry<TData>(
  key: string,
  initialData?: TData,
): ServerQueryEntry<TData> {
  const cachedEntry = serverQueryCache.get(key);
  if (cachedEntry) {
    markEntryAccess(cachedEntry);
    return cachedEntry as ServerQueryEntry<TData>;
  }

  const now = Date.now();
  const nextEntry: ServerQueryEntry<TData> = {
    data: initialData,
    error: null,
    updatedAt: initialData === undefined ? 0 : now,
    lastAccessedAt: now,
    isFetching: false,
    listeners: new Set(),
  };
  serverQueryCache.set(key, nextEntry);
  pruneServerQueryCache();
  return nextEntry;
}

function notifyEntry(entry: ServerQueryEntry<unknown>) {
  entry.listeners.forEach((listener) => listener());
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed";
}

async function runWithRetry<TData>(
  queryFn: () => Promise<TData>,
  retryCount: number,
  retryDelayMs: number,
): Promise<TData> {
  let attempts = 0;
  let lastError: unknown = null;

  while (attempts <= retryCount) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      if (attempts >= retryCount) {
        break;
      }

      const delay = retryDelayMs * (attempts + 1);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });
    }

    attempts += 1;
  }

  throw lastError;
}

export function invalidateServerQuery(key: string) {
  const entry = serverQueryCache.get(key);
  if (!entry) {
    return;
  }

  markEntryAccess(entry);
  entry.updatedAt = 0;
  notifyEntry(entry);
}

export function setServerQueryData<TData>(key: string, data: TData) {
  const entry = getEntry<TData>(key);
  markEntryAccess(entry as ServerQueryEntry<unknown>);
  entry.data = data;
  entry.error = null;
  entry.updatedAt = Date.now();
  notifyEntry(entry as ServerQueryEntry<unknown>);
  pruneServerQueryCache();
}

export function useServerQuery<TData>({
  key,
  queryFn,
  enabled = true,
  staleTimeMs = 60_000,
  retryCount = 1,
  retryDelayMs = 600,
  initialData,
}: UseServerQueryOptions<TData>): UseServerQueryResult<TData> {
  const [, setVersion] = useState(0);
  const cacheEntry = useMemo(
    () => getEntry<TData>(key, initialData),
    [initialData, key],
  );

  const forceUpdate = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    cacheEntry.listeners.add(forceUpdate);
    return () => {
      cacheEntry.listeners.delete(forceUpdate);
    };
  }, [cacheEntry, forceUpdate]);

  const executeFetch = useCallback(
    async (force: boolean): Promise<TData | undefined> => {
      if (!enabled) {
        markEntryAccess(cacheEntry as ServerQueryEntry<unknown>);
        return cacheEntry.data;
      }

      markEntryAccess(cacheEntry as ServerQueryEntry<unknown>);
      const isFresh =
        cacheEntry.updatedAt > 0 &&
        Date.now() - cacheEntry.updatedAt < staleTimeMs;
      if (!force && isFresh && cacheEntry.data !== undefined) {
        return cacheEntry.data;
      }

      if (!force && cacheEntry.inFlight) {
        return cacheEntry.inFlight;
      }

      cacheEntry.isFetching = true;
      cacheEntry.error = null;
      notifyEntry(cacheEntry as ServerQueryEntry<unknown>);

      const request = runWithRetry(queryFn, retryCount, retryDelayMs)
        .then((data) => {
          cacheEntry.data = data;
          cacheEntry.error = null;
          cacheEntry.updatedAt = Date.now();
          markEntryAccess(cacheEntry as ServerQueryEntry<unknown>);
          return data;
        })
        .catch((error) => {
          cacheEntry.error = toErrorMessage(error);
          throw error;
        })
        .finally(() => {
          cacheEntry.isFetching = false;
          cacheEntry.inFlight = undefined;
          markEntryAccess(cacheEntry as ServerQueryEntry<unknown>);
          notifyEntry(cacheEntry as ServerQueryEntry<unknown>);
          pruneServerQueryCache();
        });

      cacheEntry.inFlight = request;

      try {
        return await request;
      } catch {
        return cacheEntry.data;
      }
    },
    [cacheEntry, enabled, queryFn, retryCount, retryDelayMs, staleTimeMs],
  );

  useEffect(() => {
    void executeFetch(false);
  }, [executeFetch]);

  return {
    data: cacheEntry.data,
    error: cacheEntry.error,
    isLoading: enabled && cacheEntry.isFetching && cacheEntry.data === undefined,
    isFetching: enabled && cacheEntry.isFetching,
    refetch: () => executeFetch(true),
  };
}

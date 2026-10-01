import { useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";
import { serverQueryClient } from "../query/queryClient";

const SERVER_QUERY_NAMESPACE = "server-query";

type ServerQueryContext = {
  signal: AbortSignal;
};

type InvalidateServerQueryOptions = {
  cancelInFlight?: boolean;
};

type UpdateServerQueryDataOptions = {
  cancelInFlight?: boolean;
  preserveError?: boolean;
  keepFreshWhenUndefined?: boolean;
};

type UseServerQueryOptions<TData> = {
  key: string;
  queryFn: (context: ServerQueryContext) => Promise<TData>;
  tags?: string[];
  enabled?: boolean;
  staleTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  initialData?: TData;
};

type UseServerQueryResult<TData> = {
  data?: TData;
  error: string | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<TData | undefined>;
  cancel: () => void;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Request failed";
}

function toQueryKey(key: string) {
  return [SERVER_QUERY_NAMESPACE, key] as const;
}

function getServerKey(query: Query): string | null {
  const queryKey = query.queryKey;
  if (!Array.isArray(queryKey) || queryKey.length < 2) {
    return null;
  }
  if (queryKey[0] !== SERVER_QUERY_NAMESPACE) {
    return null;
  }
  if (typeof queryKey[1] !== "string") {
    return null;
  }

  return queryKey[1];
}

function normalizeServerQueryTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function normalizeServerQueryTags(tags: string[] | undefined): string[] {
  if (!Array.isArray(tags) || tags.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => normalizeServerQueryTag(String(tag)))
        .filter((tag) => tag.length > 0),
    ),
  );
}

function getServerQueryTags(query: Query): string[] {
  const tags = query.meta?.serverQueryTags;
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string")
    : [];
}

function cancelServerQueries(
  matcher: (key: string) => boolean,
  queryClient: QueryClient = serverQueryClient,
) {
  void queryClient.cancelQueries({
    predicate: (query) => {
      const key = getServerKey(query);
      return key !== null && matcher(key);
    },
  });
}

function invalidateServerQueries(
  matcher: (key: string) => boolean,
  options: InvalidateServerQueryOptions = {},
  queryClient: QueryClient = serverQueryClient,
) {
  if (options.cancelInFlight) {
    cancelServerQueries(matcher, queryClient);
  }

  void queryClient.invalidateQueries({
    predicate: (query) => {
      const key = getServerKey(query);
      return key !== null && matcher(key);
    },
  });
}

export function useServerQuery<TData>({
  key,
  queryFn,
  tags,
  enabled = true,
  staleTimeMs = 60_000,
  retryCount = 1,
  retryDelayMs = 600,
  refetchOnWindowFocus = false,
  refetchOnReconnect = false,
  initialData,
}: UseServerQueryOptions<TData>): UseServerQueryResult<TData> {
  const normalizedTags = useMemo(() => normalizeServerQueryTags(tags), [tags]);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: toQueryKey(key),
    meta: { serverQueryTags: normalizedTags },
    queryFn: ({ signal }) => queryFn({ signal }),
    enabled,
    staleTime: staleTimeMs,
    retry: retryCount,
    retryDelay: (attempt) => retryDelayMs * Math.max(1, attempt),
    refetchOnWindowFocus,
    refetchOnReconnect,
    initialData,
  });

  return {
    data: query.data,
    error: query.error ? toErrorMessage(query.error) : null,
    isLoading: enabled && query.isPending && query.data === undefined,
    isFetching: enabled && query.isFetching,
    refetch: async () => {
      const result = await query.refetch();
      return result.data;
    },
    cancel: () => {
      void queryClient.cancelQueries({
        queryKey: toQueryKey(key),
        exact: true,
      });
    },
  };
}

function invalidateServerQuery(
  key: string,
  options: InvalidateServerQueryOptions = {},
  queryClient: QueryClient = serverQueryClient,
) {
  invalidateServerQueries(
    (candidateKey) => candidateKey === key,
    options,
    queryClient,
  );
}

function invalidateServerQueryTag(
  tag: string,
  options: InvalidateServerQueryOptions = {},
  queryClient: QueryClient = serverQueryClient,
) {
  const normalizedTag = normalizeServerQueryTag(tag);
  if (!normalizedTag) {
    return;
  }

  if (options.cancelInFlight) {
    void queryClient.cancelQueries({
      predicate: (query) => getServerQueryTags(query).includes(normalizedTag),
    });
  }

  void queryClient.invalidateQueries({
    predicate: (query) => getServerQueryTags(query).includes(normalizedTag),
  });
}

function getServerQueryData<TData>(
  key: string,
  queryClient: QueryClient = serverQueryClient,
): TData | undefined {
  return queryClient.getQueryData<TData>(toQueryKey(key));
}

function setServerQueryData<TData>(
  key: string,
  data: TData,
  queryClient: QueryClient = serverQueryClient,
) {
  queryClient.setQueryData(toQueryKey(key), data);
}

function updateServerQueryData<TData>(
  key: string,
  updater: (current: TData | undefined) => TData | undefined,
  options: UpdateServerQueryDataOptions = {},
  queryClient: QueryClient = serverQueryClient,
): TData | undefined {
  if (options.cancelInFlight) {
    void queryClient.cancelQueries({
      queryKey: toQueryKey(key),
      exact: true,
    });
  }

  let nextValue: TData | undefined;
  queryClient.setQueryData<TData | undefined>(toQueryKey(key), (current) => {
    nextValue = updater(current);
    return nextValue;
  });

  if (nextValue === undefined && !options.keepFreshWhenUndefined) {
    invalidateServerQuery(key, { cancelInFlight: false }, queryClient);
  }

  // TanStack Query tracks error state with query status; resetting here would
  // discard optimistic updates (e.g. favorites toggles) before mutation settles.
  // Keep updated data intact and let follow-up invalidation/refetch resolve state.
  void options.preserveError;

  return nextValue;
}

export {
  getServerQueryData,
  invalidateServerQuery,
  invalidateServerQueryTag,
  setServerQueryData,
  updateServerQueryData,
};

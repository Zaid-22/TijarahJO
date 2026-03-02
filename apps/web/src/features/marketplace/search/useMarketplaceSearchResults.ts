import { useMemo } from "react";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useServerQuery } from "../../../shared/hooks/useServerQuery";
import { isActivePost } from "../../../lib/searchRanking";
import { Post } from "../../../types";
import {
  MarketplaceSearchPreset,
  runMarketplaceSearchPipeline,
} from "./marketplaceSearch";

type MarketplaceSearchSortBy = "date" | "price" | "views";
type MarketplaceSearchSortOrder = "asc" | "desc";

type BuildFallbackPostsParams = {
  activePosts: Post[];
  query: string;
};

interface UseMarketplaceSearchResultsOptions {
  preset: MarketplaceSearchPreset;
  query: string;
  sourcePosts: Post[];
  buildFallbackPosts: (params: BuildFallbackPostsParams) => Post[];
  fallbackErrorMessage: string;
  transformRemotePosts?: (posts: Post[], query: string) => Post[];
  enabled?: boolean;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: MarketplaceSearchSortBy;
  sortOrder?: MarketplaceSearchSortOrder;
  debounceMs?: number;
  shouldRequestWhenQueryEmpty?: boolean;
  staleTimeMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

interface UseMarketplaceSearchResultsReturn {
  posts: Post[];
  error: string | null;
  isSearching: boolean;
  query: string;
  refetch: () => Promise<{ posts: Post[]; error: string | null } | undefined>;
}

function normalizeQueryKey(value: string): string {
  return encodeURIComponent(value.toLowerCase());
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}

function buildSearchCacheKey({
  preset,
  query,
  page,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
}: {
  preset: MarketplaceSearchPreset;
  query: string;
  page: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy: MarketplaceSearchSortBy;
  sortOrder: MarketplaceSearchSortOrder;
}) {
  return [
    "marketplace:search",
    preset,
    normalizeQueryKey(query),
    `page:${page}`,
    `min:${formatOptionalNumber(minPrice)}`,
    `max:${formatOptionalNumber(maxPrice)}`,
    `sort:${sortBy}`,
    `order:${sortOrder}`,
  ].join(":");
}

export function useMarketplaceSearchResults({
  preset,
  query,
  sourcePosts,
  buildFallbackPosts,
  fallbackErrorMessage,
  transformRemotePosts,
  enabled = true,
  page = 1,
  minPrice,
  maxPrice,
  sortBy = "date",
  sortOrder = "desc",
  debounceMs = 300,
  shouldRequestWhenQueryEmpty = false,
  staleTimeMs = 25_000,
  retryCount = 1,
  retryDelayMs = 600,
}: UseMarketplaceSearchResultsOptions): UseMarketplaceSearchResultsReturn {
  const debouncedQuery = useDebounce(query, debounceMs);
  const normalizedQuery = debouncedQuery.trim();
  const activePosts = useMemo(
    () => sourcePosts.filter(isActivePost),
    [sourcePosts],
  );
  const fallbackPosts = useMemo(
    () =>
      buildFallbackPosts({
        activePosts,
        query: normalizedQuery,
      }).filter(isActivePost),
    [activePosts, buildFallbackPosts, normalizedQuery],
  );
  const shouldRequest =
    enabled && (shouldRequestWhenQueryEmpty || normalizedQuery.length > 0);
  const cacheKey = useMemo(
    () =>
      buildSearchCacheKey({
        preset,
        query: normalizedQuery,
        page,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      }),
    [maxPrice, minPrice, normalizedQuery, page, preset, sortBy, sortOrder],
  );
  const queryTags = useMemo(
    () => ["posts", "marketplace-search", `marketplace-search:${preset}`],
    [preset],
  );

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useServerQuery<{ posts: Post[]; error: string | null }>({
    key: cacheKey,
    tags: queryTags,
    enabled: shouldRequest,
    staleTimeMs,
    retryCount,
    retryDelayMs,
    refetchOnReconnect: true,
    queryFn: ({ signal }) =>
      runMarketplaceSearchPipeline({
        request: {
          query: normalizedQuery || undefined,
          preset,
          page,
          minPrice,
          maxPrice,
          sortBy,
          sortOrder,
        },
        signal,
        buildFallbackPosts: () => fallbackPosts,
        fallbackErrorMessage,
        transformRemotePosts: transformRemotePosts
          ? (posts) => transformRemotePosts(posts, normalizedQuery)
          : undefined,
      }),
  });

  const posts = useMemo(() => {
    if (!shouldRequest) {
      return fallbackPosts;
    }

    if (!data) {
      return fallbackPosts;
    }

    // Keep fallback posts synced with source data on remote failures.
    if (data.error) {
      return fallbackPosts;
    }

    return data.posts;
  }, [data, fallbackPosts, shouldRequest]);

  const resolvedError = useMemo(() => {
    if (!enabled || !shouldRequest) {
      return null;
    }

    if (fallbackPosts.length > 0) {
      return null;
    }

    return data?.error || error;
  }, [data?.error, enabled, error, fallbackPosts.length, shouldRequest]);

  return {
    posts,
    error: resolvedError,
    isSearching: shouldRequest && (isLoading || isFetching),
    query: normalizedQuery,
    refetch,
  };
}

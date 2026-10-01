import { useMemo } from "react";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useServerQuery } from "../../../shared/hooks/useServerQuery";
import { isActivePost } from "../../../lib/searchRanking";
import { Post } from "../../../types";
import {
  MarketplaceSearchPreset,
  resolveMarketplaceSearchLimit,
  runMarketplaceSearchPipeline,
} from "./marketplaceSearch";
import type {
  SearchPagination,
  SearchPipelineResult,
} from "./searchPipeline";

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
  limit?: number;
  category?: string;
  city?: string;
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
  pagination: SearchPagination;
  refetch: () => Promise<SearchPipelineResult | undefined>;
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
  limit,
  category,
  city,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
}: {
  preset: MarketplaceSearchPreset;
  query: string;
  page: number;
  limit: number;
  category?: string;
  city?: string;
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
    `limit:${limit}`,
    `category:${normalizeQueryKey(category || "")}`,
    `city:${normalizeQueryKey(city || "")}`,
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
  limit: requestedLimit,
  category,
  city,
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
  const limit = requestedLimit ?? resolveMarketplaceSearchLimit(preset);
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
  const fallbackPagePosts = useMemo(() => {
    if (!shouldRequest) {
      return fallbackPosts;
    }

    const start = (page - 1) * limit;
    return fallbackPosts.slice(start, start + limit);
  }, [fallbackPosts, limit, page, shouldRequest]);
  const cacheKey = useMemo(
    () =>
      buildSearchCacheKey({
        preset,
        query: normalizedQuery,
        page,
        limit,
        category,
        city,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      }),
    [
      category,
      city,
      limit,
      maxPrice,
      minPrice,
      normalizedQuery,
      page,
      preset,
      sortBy,
      sortOrder,
    ],
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
  } = useServerQuery<SearchPipelineResult>({
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
          limit,
          category,
          city,
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
      return fallbackPagePosts;
    }

    // Keep fallback posts synced with source data on remote failures.
    if (data.error) {
      return fallbackPagePosts;
    }

    return data.posts;
  }, [data, fallbackPagePosts, fallbackPosts, shouldRequest]);

  const resolvedError = useMemo(() => {
    if (!enabled || !shouldRequest) {
      return null;
    }

    if (fallbackPosts.length > 0) {
      return null;
    }

    return data?.error || error;
  }, [data?.error, enabled, error, fallbackPosts.length, shouldRequest]);

  const pagination = useMemo<SearchPagination>(() => {
    if (data?.pagination && !data.error) {
      return {
        ...data.pagination,
        currentPage: Math.max(1, data.pagination.currentPage),
        // The API represents an empty result set with zero pages, while the
        // URL state always has a valid first page. Normalizing here avoids a
        // repeated `page=0` correction on empty searches.
        totalPages: Math.max(1, data.pagination.totalPages),
      };
    }

    return {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(fallbackPosts.length / limit)),
      totalPosts: fallbackPosts.length,
      postsPerPage: limit,
    };
  }, [data?.error, data?.pagination, fallbackPosts.length, limit, page]);

  return {
    posts,
    error: resolvedError,
    isSearching: shouldRequest && (isLoading || isFetching),
    query: normalizedQuery,
    pagination,
    refetch,
  };
}

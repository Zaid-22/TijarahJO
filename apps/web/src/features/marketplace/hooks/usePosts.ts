import { useCallback, useMemo } from "react";
import { Post } from "../../../types";
import { api } from "../../../services/api";
import {
  invalidateServerQueryTag,
  setServerQueryData,
  useServerQuery,
} from "../../../shared/hooks/useServerQuery";
import { rankMarketplacePosts } from "../search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { isActivePost } from "../../../lib/searchRanking";

interface UsePostsOptions {
  enabled?: boolean;
}

const POSTS_FEED_CACHE_KEY = "posts:feed";
const POSTS_FEED_QUERY_TAGS = ["posts", "posts-feed"];

export function usePosts(
  debouncedSearchQuery: string,
  options: UsePostsOptions = {},
) {
  const { enabled = true } = options;
  const query = debouncedSearchQuery.trim();

  const {
    data: postsData,
    error: postsError,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useServerQuery<Post[]>({
    key: POSTS_FEED_CACHE_KEY,
    tags: POSTS_FEED_QUERY_TAGS,
    enabled,
    staleTimeMs: 45_000,
    retryCount: 1,
    retryDelayMs: 700,
    refetchOnReconnect: true,
    queryFn: async ({ signal }) => {
      const response = await api.posts.getPosts(undefined, {
        signal,
        throwOnAbort: true,
      });
      if (response.success && response.posts) {
        return response.posts;
      }

      throw new Error(response.error?.message || "Failed to load posts");
    },
  });

  const availablePosts = useMemo(
    () => (enabled ? postsData || [] : []),
    [enabled, postsData],
  );
  const fallbackSearchPosts = useMemo(
    () => rankMarketplacePosts(availablePosts, query),
    [availablePosts, query],
  );
  const buildFallbackPosts = useCallback(
    () => fallbackSearchPosts,
    [fallbackSearchPosts],
  );

  const transformRemotePosts = useCallback(
    (posts: Post[], normalizedQuery: string) =>
      rankMarketplacePosts(posts, normalizedQuery),
    [],
  );

  const {
    posts: searchResults,
    error: searchError,
    isSearching: isSearchingPosts,
    refetch: refetchSearch,
  } = useMarketplaceSearchResults({
    preset: "home",
    query,
    sourcePosts: availablePosts,
    enabled,
    page: 1,
    sortBy: "date",
    sortOrder: "desc",
    fallbackErrorMessage: "Failed to search posts",
    staleTimeMs: 20_000,
    retryCount: 1,
    retryDelayMs: 500,
    buildFallbackPosts,
    transformRemotePosts,
  });

  const filteredPosts = useMemo(() => {
    if (!enabled) {
      return [];
    }

    if (!query) {
      return availablePosts.filter(isActivePost);
    }

    return searchResults;
  }, [availablePosts, enabled, query, searchResults]);

  const postsErrorState = useMemo(() => {
    if (!enabled) {
      return null;
    }

    if (!query) {
      return postsError && availablePosts.length === 0 ? postsError : null;
    }

    return searchError && filteredPosts.length === 0 ? searchError : null;
  }, [
    availablePosts.length,
    enabled,
    filteredPosts.length,
    postsError,
    query,
    searchError,
  ]);

  const fetchPostsFromBackend = useCallback(async () => {
    if (!enabled) {
      return;
    }

    await refetchPosts();

    if (query.length > 0) {
      await refetchSearch();
    }
  }, [enabled, query.length, refetchPosts, refetchSearch]);

  const setAvailablePosts = useCallback((posts: Post[]) => {
    setServerQueryData(POSTS_FEED_CACHE_KEY, posts);
    invalidateServerQueryTag("marketplace-search", {
      cancelInFlight: true,
    });
  }, []);

  return {
    availablePosts,
    isLoadingPosts:
      enabled && (isLoadingPosts || (query.length > 0 && isSearchingPosts)),
    postsError: postsErrorState,
    filteredPosts,
    fetchPostsFromBackend,
    setAvailablePosts,
  };
}

import { useCallback, useMemo } from "react";
import { Product } from "../../../types";
import { api } from "../../../services/api";
import { isActiveProduct, rankProductsBySearch } from "../../../lib/searchRanking";
import { APP_CONFIG } from "../../../constants/appConfig";
import {
  invalidateServerQuery,
  setServerQueryData,
  useServerQuery,
} from "../../../shared/hooks/useServerQuery";

interface UseProductsOptions {
  enabled?: boolean;
}

const PRODUCTS_FEED_CACHE_KEY = "products:feed";

export function useProducts(
  debouncedSearchQuery: string,
  options: UseProductsOptions = {},
) {
  const { enabled = true } = options;
  const query = debouncedSearchQuery.trim();
  const normalizedQueryKey = query.toLowerCase();
  const searchCacheKey = `products:search:${normalizedQueryKey}`;

  const {
    data: postsData,
    error: postsError,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useServerQuery<Product[]>({
    key: PRODUCTS_FEED_CACHE_KEY,
    enabled,
    staleTimeMs: 45_000,
    retryCount: 1,
    retryDelayMs: 700,
    queryFn: async () => {
      const response = await api.posts.getPosts();
      if (response.success && response.posts) {
        return response.posts;
      }

      throw new Error(response.error?.message || "Failed to load products");
    },
  });

  const {
    data: searchData,
    error: searchError,
    isFetching: isFetchingSearch,
    refetch: refetchSearch,
  } = useServerQuery<Product[]>({
    key: searchCacheKey,
    enabled: enabled && query.length > 0,
    staleTimeMs: 20_000,
    retryCount: 1,
    retryDelayMs: 500,
    queryFn: async () => {
      const response = await api.search.search({
        query,
        status: "ACTIVE",
        page: 1,
        limit: APP_CONFIG.search.homeLimit,
        sortBy: "date",
        sortOrder: "desc",
      });

      if (response.success) {
        return response.posts;
      }

      throw new Error(response.error?.message || "Failed to search products");
    },
  });

  const availableProducts = useMemo(
    () => (enabled ? postsData || [] : []),
    [enabled, postsData],
  );

  const filteredProducts = useMemo(() => {
    if (!enabled) {
      return [];
    }

    if (!query) {
      return availableProducts.filter(isActiveProduct);
    }

    const remoteResults = searchData || [];
    if (remoteResults.length > 0) {
      return rankProductsBySearch(remoteResults, query);
    }

    return rankProductsBySearch(availableProducts, query);
  }, [availableProducts, enabled, query, searchData]);

  const productsError = useMemo(() => {
    if (!enabled) {
      return null;
    }

    if (!query) {
      return postsError && availableProducts.length === 0 ? postsError : null;
    }

    return searchError && filteredProducts.length === 0 ? searchError : null;
  }, [availableProducts.length, enabled, filteredProducts.length, postsError, query, searchError]);

  const fetchPostsFromBackend = useCallback(async () => {
    if (!enabled) {
      return;
    }

    invalidateServerQuery(PRODUCTS_FEED_CACHE_KEY);
    await refetchPosts();

    if (query.length > 0) {
      invalidateServerQuery(searchCacheKey);
      await refetchSearch();
    }
  }, [enabled, query.length, refetchPosts, refetchSearch, searchCacheKey]);

  const setAvailableProducts = useCallback((products: Product[]) => {
    setServerQueryData(PRODUCTS_FEED_CACHE_KEY, products);
  }, []);

  return {
    availableProducts,
    isLoadingProducts: enabled && (isLoadingPosts || (query.length > 0 && isFetchingSearch)),
    productsError,
    filteredProducts,
    fetchPostsFromBackend,
    setAvailableProducts,
  };
}

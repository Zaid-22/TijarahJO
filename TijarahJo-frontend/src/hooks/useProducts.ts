import { useState, useEffect, useCallback } from "react";
import { Product } from "../types";
import { api } from "../services/api";
import { isActiveProduct, rankProductsBySearch } from "../lib/searchRanking";
import { APP_CONFIG } from "../constants/appConfig";

export function useProducts(debouncedSearchQuery: string) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [hasFetchedInitialProducts, setHasFetchedInitialProducts] =
    useState(false);

  const fetchPostsFromBackend = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const response = await api.posts.getPosts();
      if (response.success && response.posts) {
        setAvailableProducts(response.posts);
      } else {
        setAvailableProducts([]);
        setFilteredProducts([]);
        if (response.error) setProductsError(response.error.message);
      }
    } catch (error) {
      console.error(error);
      setAvailableProducts([]);
      setFilteredProducts([]);
      setProductsError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
      setHasFetchedInitialProducts(true);
    }
  }, []);

  useEffect(() => {
    void fetchPostsFromBackend();
  }, [fetchPostsFromBackend]);

  useEffect(() => {
    let cancelled = false;
    const query = debouncedSearchQuery.trim();

    if (!query) {
      setProductsError(null);
      setFilteredProducts(availableProducts.filter(isActiveProduct));
      if (hasFetchedInitialProducts) {
        setIsLoadingProducts(false);
      }
      return;
    }

    setIsLoadingProducts(true);
    setProductsError(null);

    void (async () => {
      try {
        const response = await api.search.search({
          query,
          status: "ACTIVE",
          page: 1,
          limit: APP_CONFIG.search.homeLimit,
          sortBy: "date",
          sortOrder: "desc",
        });

        if (cancelled) {
          return;
        }

        if (response.success) {
          setFilteredProducts(rankProductsBySearch(response.posts, query));
          setProductsError(null);
          return;
        }

        const fallbackResults = rankProductsBySearch(availableProducts, query);
        setFilteredProducts(fallbackResults);
        setProductsError(
          fallbackResults.length > 0
            ? null
            : response.error?.message || "Failed to search products",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error(error);
        const fallbackResults = rankProductsBySearch(availableProducts, query);
        setFilteredProducts(fallbackResults);
        setProductsError(
          fallbackResults.length > 0 ? null : "Failed to search products",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [availableProducts, debouncedSearchQuery, hasFetchedInitialProducts]);

  return {
    availableProducts,
    isLoadingProducts,
    productsError,
    filteredProducts,
    fetchPostsFromBackend,
    setAvailableProducts,
  };
}

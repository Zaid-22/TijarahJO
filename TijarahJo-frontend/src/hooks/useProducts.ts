import { useState, useEffect, useMemo } from "react";
import { Product } from "../types";
import { api } from "../services/api";
import { rankProductsBySearch } from "../lib/searchRanking";

export function useProducts(debouncedSearchQuery: string) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const fetchPostsFromBackend = async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const response = await api.posts.getPosts();
      if (response.success && response.posts) {
        setAvailableProducts(response.posts);
      } else {
        setAvailableProducts([]);
        if (response.error) setProductsError(response.error.message);
      }
    } catch (error) {
      console.error(error);
      setAvailableProducts([]);
      setProductsError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchPostsFromBackend();
  }, []);

  const filteredProducts = useMemo(() => {
    return rankProductsBySearch(availableProducts, debouncedSearchQuery);
  }, [availableProducts, debouncedSearchQuery]);

  return {
    availableProducts,
    isLoadingProducts,
    productsError,
    filteredProducts,
    fetchPostsFromBackend,
    setAvailableProducts,
  };
}

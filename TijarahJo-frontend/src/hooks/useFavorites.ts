import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../constants";
import { storage } from "../utils";

/**
 * Custom hook to manage favorite products with localStorage persistence
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = storage.get<string[]>(STORAGE_KEYS.FAVORITES, []);
    setFavoriteIds(savedFavorites);
    setIsLoading(false);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storage.set(STORAGE_KEYS.FAVORITES, favoriteIds);
    }
  }, [favoriteIds, isLoading]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  const addFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(productId)) {
        return prev;
      }
      return [...prev, productId];
    });
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const isFavorite = useCallback(
    (productId: string) => {
      return favoriteIds.includes(productId);
    },
    [favoriteIds]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  return {
    favoriteIds,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    isLoading,
    count: favoriteIds.length,
  };
}
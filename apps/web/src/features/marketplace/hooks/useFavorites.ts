import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../../../constants";
import { storage } from "../../../utils";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";

/**
 * Custom hook to manage favorite products with localStorage persistence
 */
interface UseFavoritesOptions {
  enabled?: boolean;
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeFavoriteIds = useCallback((ids: Array<string | number>) => {
    return Array.from(
      new Set(
        ids
          .map((value) => String(value).trim())
          .filter((value) => value.length > 0),
      ),
    );
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (!isAuthenticated) {
      const savedFavorites = storage.get<string[]>(STORAGE_KEYS.FAVORITES, []);
      setFavoriteIds(normalizeFavoriteIds(savedFavorites));
      setIsLoading(false);
      return;
    }

    try {
      const serverFavorites = await api.favorites.getFavorites();
      const normalized = normalizeFavoriteIds(serverFavorites);
      setFavoriteIds(normalized);
      storage.set(STORAGE_KEYS.FAVORITES, normalized);
    } catch (error) {
      console.error("Failed to load favorites from API:", error);
      setFavoriteIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isAuthenticated, normalizeFavoriteIds]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  // Persist local favorites for guest browsing.
  useEffect(() => {
    if (enabled && !isLoading && !isAuthenticated) {
      storage.set(STORAGE_KEYS.FAVORITES, normalizeFavoriteIds(favoriteIds));
    }
  }, [enabled, favoriteIds, isLoading, isAuthenticated, normalizeFavoriteIds]);

  const addFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = productId.trim();
      if (!normalizedProductId) {
        return;
      }

      if (!isAuthenticated) {
        setFavoriteIds((prev) =>
          prev.includes(normalizedProductId)
            ? prev
            : [...prev, normalizedProductId],
        );
        return;
      }

      void (async () => {
        const success = await api.favorites.addFavorite(normalizedProductId);
        if (!success) {
          console.error(`Failed to add favorite ${normalizedProductId}`);
          return;
        }

        setFavoriteIds((prev) =>
          prev.includes(normalizedProductId)
            ? prev
            : [...prev, normalizedProductId],
        );
      })();
    },
    [isAuthenticated],
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = productId.trim();
      if (!normalizedProductId) {
        return;
      }

      if (!isAuthenticated) {
        setFavoriteIds((prev) => prev.filter((id) => id !== normalizedProductId));
        return;
      }

      void (async () => {
        const success = await api.favorites.removeFavorite(normalizedProductId);
        if (!success) {
          console.error(`Failed to remove favorite ${normalizedProductId}`);
          return;
        }

        setFavoriteIds((prev) => prev.filter((id) => id !== normalizedProductId));
      })();
    },
    [isAuthenticated],
  );

  const toggleFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = productId.trim();
      if (!normalizedProductId) {
        return;
      }

      if (favoriteIds.includes(normalizedProductId)) {
        removeFavorite(normalizedProductId);
        return;
      }

      addFavorite(normalizedProductId);
    },
    [favoriteIds, addFavorite, removeFavorite],
  );

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

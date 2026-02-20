import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../../constants";
import { storage } from "../../../utils";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import {
  invalidateServerQuery,
  setServerQueryData,
  useServerQuery,
} from "../../../shared/hooks/useServerQuery";
import { logger } from "../../../shared/lib/logger";

interface UseFavoritesOptions {
  enabled?: boolean;
}

function normalizeFavoriteIds(ids: Array<string | number>): string[] {
  return Array.from(
    new Set(
      ids
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function normalizeProductId(productId: string): string {
  return productId.trim();
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { enabled = true } = options;
  const { isAuthenticated, user } = useAuth();
  const [guestFavoriteIds, setGuestFavoriteIds] = useState<string[]>(() =>
    normalizeFavoriteIds(storage.get<string[]>(STORAGE_KEYS.FAVORITES, [])),
  );

  const authFavoritesCacheKey = useMemo(() => {
    const normalizedUserId = String(user?.id || "self").trim() || "self";
    return `favorites:auth:${normalizedUserId}`;
  }, [user?.id]);

  const {
    data: authFavoriteIds,
    isLoading: isLoadingAuthFavorites,
    isFetching: isFetchingAuthFavorites,
    refetch: refetchAuthFavorites,
  } = useServerQuery<string[]>({
    key: authFavoritesCacheKey,
    enabled: enabled && isAuthenticated,
    staleTimeMs: 30_000,
    retryCount: 1,
    retryDelayMs: 600,
    queryFn: async () => {
      const serverFavorites = await api.favorites.getFavorites();
      return normalizeFavoriteIds(serverFavorites);
    },
  });

  useEffect(() => {
    if (!enabled || isAuthenticated) {
      return;
    }

    const savedFavorites = normalizeFavoriteIds(
      storage.get<string[]>(STORAGE_KEYS.FAVORITES, []),
    );
    setGuestFavoriteIds(savedFavorites);
  }, [enabled, isAuthenticated]);

  useEffect(() => {
    if (!enabled || isAuthenticated) {
      return;
    }

    storage.set(STORAGE_KEYS.FAVORITES, normalizeFavoriteIds(guestFavoriteIds));
  }, [enabled, guestFavoriteIds, isAuthenticated]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    storage.set(
      STORAGE_KEYS.FAVORITES,
      normalizeFavoriteIds(authFavoriteIds || []),
    );
  }, [authFavoriteIds, enabled, isAuthenticated]);

  const favoriteIds = useMemo(() => {
    if (!enabled) {
      return [];
    }

    if (isAuthenticated) {
      return normalizeFavoriteIds(authFavoriteIds || []);
    }

    return normalizeFavoriteIds(guestFavoriteIds);
  }, [authFavoriteIds, enabled, guestFavoriteIds, isAuthenticated]);

  const addFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = normalizeProductId(productId);
      if (!normalizedProductId || !enabled) {
        return;
      }

      if (!isAuthenticated) {
        setGuestFavoriteIds((previous) =>
          previous.includes(normalizedProductId)
            ? previous
            : [...previous, normalizedProductId],
        );
        return;
      }

      if (favoriteIds.includes(normalizedProductId)) {
        return;
      }

      setServerQueryData(authFavoritesCacheKey, [
        ...favoriteIds,
        normalizedProductId,
      ]);

      void (async () => {
        const success = await api.favorites.addFavorite(normalizedProductId);
        if (!success) {
          logger.warn(`Failed to add favorite ${normalizedProductId}`);
          invalidateServerQuery(authFavoritesCacheKey);
          await refetchAuthFavorites();
        }
      })();
    },
    [authFavoritesCacheKey, enabled, favoriteIds, isAuthenticated, refetchAuthFavorites],
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = normalizeProductId(productId);
      if (!normalizedProductId || !enabled) {
        return;
      }

      if (!isAuthenticated) {
        setGuestFavoriteIds((previous) =>
          previous.filter((id) => id !== normalizedProductId),
        );
        return;
      }

      const nextFavorites = favoriteIds.filter((id) => id !== normalizedProductId);
      setServerQueryData(authFavoritesCacheKey, nextFavorites);

      void (async () => {
        const success = await api.favorites.removeFavorite(normalizedProductId);
        if (!success) {
          logger.warn(`Failed to remove favorite ${normalizedProductId}`);
          invalidateServerQuery(authFavoritesCacheKey);
          await refetchAuthFavorites();
        }
      })();
    },
    [authFavoritesCacheKey, enabled, favoriteIds, isAuthenticated, refetchAuthFavorites],
  );

  const toggleFavorite = useCallback(
    (productId: string) => {
      const normalizedProductId = normalizeProductId(productId);
      if (!normalizedProductId) {
        return;
      }

      if (favoriteIds.includes(normalizedProductId)) {
        removeFavorite(normalizedProductId);
        return;
      }

      addFavorite(normalizedProductId);
    },
    [addFavorite, favoriteIds, removeFavorite],
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(normalizeProductId(productId)),
    [favoriteIds],
  );

  const clearFavorites = useCallback(() => {
    if (!isAuthenticated) {
      setGuestFavoriteIds([]);
      storage.set(STORAGE_KEYS.FAVORITES, []);
      return;
    }

    setServerQueryData(authFavoritesCacheKey, []);
  }, [authFavoritesCacheKey, isAuthenticated]);

  const isLoading =
    enabled &&
    isAuthenticated &&
    ((isLoadingAuthFavorites && favoriteIds.length === 0) ||
      (isFetchingAuthFavorites && favoriteIds.length === 0));

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

import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../../constants";
import { storage } from "../../../utils";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import {
  getServerQueryData,
  invalidateServerQuery,
  invalidateServerQueryTag,
  setServerQueryData,
  updateServerQueryData,
  useServerQuery,
} from "../../../shared/hooks/useServerQuery";
import { useServerMutation } from "../../../shared/hooks/useServerMutation";

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

function normalizePostId(postId: string): string {
  return postId.trim();
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
  const favoritesTag = useMemo(() => {
    const normalizedUserId = String(user?.id || "self").trim() || "self";
    return `favorites:${normalizedUserId}`;
  }, [user?.id]);
  const favoriteQueryTags = useMemo(
    () => ["favorites", favoritesTag],
    [favoritesTag],
  );

  const {
    data: authFavoriteIds,
    error: authFavoritesError,
    isLoading: isLoadingAuthFavorites,
    isFetching: isFetchingAuthFavorites,
    refetch: refetchAuthFavorites,
  } = useServerQuery<string[]>({
    key: authFavoritesCacheKey,
    tags: favoriteQueryTags,
    enabled: enabled && isAuthenticated,
    staleTimeMs: 30_000,
    retryCount: 1,
    retryDelayMs: 600,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async ({ signal }) => {
      const serverFavorites = await api.favorites.getFavorites({
        signal,
        throwOnAbort: true,
      });
      return normalizeFavoriteIds(serverFavorites);
    },
  });

  const hasAuthFavoritesFailure =
    enabled && isAuthenticated && authFavoritesError !== null;

  const persistLocalFavoriteIds = useCallback((nextIds: string[]) => {
    const normalizedIds = normalizeFavoriteIds(nextIds);
    setGuestFavoriteIds(normalizedIds);
    storage.set(STORAGE_KEYS.FAVORITES, normalizedIds);
  }, []);

  useEffect(() => {
    if (!enabled || (isAuthenticated && !hasAuthFavoritesFailure)) {
      return;
    }

    const savedFavorites = normalizeFavoriteIds(
      storage.get<string[]>(STORAGE_KEYS.FAVORITES, []),
    );
    setGuestFavoriteIds(savedFavorites);
  }, [enabled, hasAuthFavoritesFailure, isAuthenticated]);

  useEffect(() => {
    if (!enabled || (isAuthenticated && !hasAuthFavoritesFailure)) {
      return;
    }

    storage.set(STORAGE_KEYS.FAVORITES, normalizeFavoriteIds(guestFavoriteIds));
  }, [enabled, guestFavoriteIds, hasAuthFavoritesFailure, isAuthenticated]);

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

    if (isAuthenticated && !hasAuthFavoritesFailure) {
      return normalizeFavoriteIds(authFavoriteIds || []);
    }

    return normalizeFavoriteIds(guestFavoriteIds);
  }, [
    authFavoriteIds,
    enabled,
    guestFavoriteIds,
    hasAuthFavoritesFailure,
    isAuthenticated,
  ]);

  const recoverAuthFavorites = useCallback(
    async (snapshot: string[] | undefined) => {
      if (snapshot) {
        setServerQueryData(authFavoritesCacheKey, snapshot);
      }

      invalidateServerQuery(authFavoritesCacheKey, {
        cancelInFlight: true,
      });
      invalidateServerQueryTag(favoritesTag, {
        cancelInFlight: true,
      });
      await refetchAuthFavorites();
    },
    [authFavoritesCacheKey, favoritesTag, refetchAuthFavorites],
  );

  const addFavoriteMutation = useServerMutation<
    string,
    boolean,
    string[] | undefined
  >({
    cancelInFlightOnMutate: false,
    mutationFn: async (postId, { signal }) => {
      const success = await api.favorites.addFavorite(postId, {
        signal,
        throwOnAbort: true,
      });
      if (!success) {
        throw new Error(`Failed to add favorite ${postId}`);
      }
      return success;
    },
    onMutate: (postId) => {
      const snapshot = normalizeFavoriteIds(
        getServerQueryData<string[]>(authFavoritesCacheKey) || [],
      );
      updateServerQueryData<string[]>(
        authFavoritesCacheKey,
        (current) => {
          const currentIds = normalizeFavoriteIds(current || []);
          if (currentIds.includes(postId)) {
            return currentIds;
          }

          return [...currentIds, postId];
        },
        { cancelInFlight: true },
      );

      return snapshot;
    },
    onError: async (_error, _postId, snapshot) => {
      await recoverAuthFavorites(snapshot);
    },
  });

  const removeFavoriteMutation = useServerMutation<
    string,
    boolean,
    string[] | undefined
  >({
    cancelInFlightOnMutate: false,
    mutationFn: async (postId, { signal }) => {
      const success = await api.favorites.removeFavorite(postId, {
        signal,
        throwOnAbort: true,
      });
      if (!success) {
        throw new Error(`Failed to remove favorite ${postId}`);
      }
      return success;
    },
    onMutate: (postId) => {
      const snapshot = normalizeFavoriteIds(
        getServerQueryData<string[]>(authFavoritesCacheKey) || [],
      );
      updateServerQueryData<string[]>(
        authFavoritesCacheKey,
        (current) => {
          const currentIds = normalizeFavoriteIds(current || []);
          if (!currentIds.includes(postId)) {
            return currentIds;
          }

          return currentIds.filter((id) => id !== postId);
        },
        { cancelInFlight: true },
      );

      return snapshot;
    },
    onError: async (_error, _postId, snapshot) => {
      await recoverAuthFavorites(snapshot);
    },
  });

  const addFavorite = useCallback(
    (postId: string) => {
      const normalizedPostId = normalizePostId(postId);
      if (!normalizedPostId || !enabled) {
        return;
      }

      if (!isAuthenticated) {
        persistLocalFavoriteIds(
          guestFavoriteIds.includes(normalizedPostId)
            ? guestFavoriteIds
            : [...guestFavoriteIds, normalizedPostId],
        );
        return;
      }

      if (hasAuthFavoritesFailure) {
        persistLocalFavoriteIds(
          guestFavoriteIds.includes(normalizedPostId)
            ? guestFavoriteIds
            : [...guestFavoriteIds, normalizedPostId],
        );
        return;
      }

      if (favoriteIds.includes(normalizedPostId)) {
        return;
      }

      void addFavoriteMutation.mutate(normalizedPostId).catch(() => {
        persistLocalFavoriteIds(
          guestFavoriteIds.includes(normalizedPostId)
            ? guestFavoriteIds
            : [...guestFavoriteIds, normalizedPostId],
        );
      });
    },
    [
      addFavoriteMutation,
      enabled,
      favoriteIds,
      guestFavoriteIds,
      hasAuthFavoritesFailure,
      isAuthenticated,
      persistLocalFavoriteIds,
    ],
  );

  const removeFavorite = useCallback(
    (postId: string) => {
      const normalizedPostId = normalizePostId(postId);
      if (!normalizedPostId || !enabled) {
        return;
      }

      if (!isAuthenticated) {
        persistLocalFavoriteIds(
          guestFavoriteIds.filter((id) => id !== normalizedPostId),
        );
        return;
      }

      if (hasAuthFavoritesFailure) {
        persistLocalFavoriteIds(
          guestFavoriteIds.filter((id) => id !== normalizedPostId),
        );
        return;
      }

      if (!favoriteIds.includes(normalizedPostId)) {
        return;
      }

      void removeFavoriteMutation.mutate(normalizedPostId).catch(() => {
        persistLocalFavoriteIds(
          guestFavoriteIds.filter((id) => id !== normalizedPostId),
        );
      });
    },
    [
      enabled,
      favoriteIds,
      guestFavoriteIds,
      hasAuthFavoritesFailure,
      isAuthenticated,
      persistLocalFavoriteIds,
      removeFavoriteMutation,
    ],
  );

  const toggleFavorite = useCallback(
    (postId: string) => {
      const normalizedPostId = normalizePostId(postId);
      if (!normalizedPostId) {
        return;
      }

      if (favoriteIds.includes(normalizedPostId)) {
        removeFavorite(normalizedPostId);
        return;
      }

      addFavorite(normalizedPostId);
    },
    [addFavorite, favoriteIds, removeFavorite],
  );

  const isFavorite = useCallback(
    (postId: string) => favoriteIds.includes(normalizePostId(postId)),
    [favoriteIds],
  );

  const clearFavorites = useCallback(() => {
    if (!isAuthenticated || hasAuthFavoritesFailure) {
      persistLocalFavoriteIds([]);
      return;
    }

    updateServerQueryData(authFavoritesCacheKey, () => [], {
      cancelInFlight: true,
    });
  }, [
    authFavoritesCacheKey,
    hasAuthFavoritesFailure,
    isAuthenticated,
    persistLocalFavoriteIds,
  ]);

  const isLoading =
    enabled &&
    isAuthenticated &&
    !hasAuthFavoritesFailure &&
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

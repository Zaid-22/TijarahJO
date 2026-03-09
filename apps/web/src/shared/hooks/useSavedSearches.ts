import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

interface SavedSearch {
  id: string;
  query: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  createdAt: string;
}

const STORAGE_KEY = "tijarahjo:saved-searches";
const MAX_SAVED = 20;

function generateId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>(
    STORAGE_KEY,
    [],
  );

  const addSavedSearch = useCallback(
    (params: Omit<SavedSearch, "id" | "createdAt">) => {
      const existing = savedSearches.find(
        (s) =>
          s.query === params.query &&
          s.category === params.category &&
          s.city === params.city,
      );
      if (existing) return;

      const newSearch: SavedSearch = {
        ...params,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      setSavedSearches((prev) => [newSearch, ...prev].slice(0, MAX_SAVED));
    },
    [savedSearches, setSavedSearches],
  );

  const removeSavedSearch = useCallback(
    (id: string) => {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    },
    [setSavedSearches],
  );

  const clearAllSavedSearches = useCallback(() => {
    setSavedSearches([]);
  }, [setSavedSearches]);

  const isSearchSaved = useCallback(
    (query: string, category?: string, city?: string) =>
      savedSearches.some(
        (s) => s.query === query && s.category === category && s.city === city,
      ),
    [savedSearches],
  );

  return useMemo(
    () => ({
      savedSearches,
      addSavedSearch,
      removeSavedSearch,
      clearAllSavedSearches,
      isSearchSaved,
    }),
    [
      savedSearches,
      addSavedSearch,
      removeSavedSearch,
      clearAllSavedSearches,
      isSearchSaved,
    ],
  );
}

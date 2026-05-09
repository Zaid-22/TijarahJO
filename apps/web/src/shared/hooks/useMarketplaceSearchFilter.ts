import type { Language } from "../../types";

interface UseMarketplaceSearchFilterParams {
  language: Language;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

interface UseMarketplaceSearchFilterResult {
  normalizedSearchQuery: string;
  clearSearch: () => void;
}

export function useMarketplaceSearchFilter({
  searchQuery,
  setSearchQuery,
}: UseMarketplaceSearchFilterParams): UseMarketplaceSearchFilterResult {
  const normalizedSearchQuery = searchQuery.trim();
  const clearSearch = () => setSearchQuery("");

  return {
    normalizedSearchQuery,
    clearSearch,
  };
}

import type { Language } from "../../types";

interface MarketplaceActiveFilterItem {
  id: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

interface UseMarketplaceSearchFilterParams {
  language: Language;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

interface UseMarketplaceSearchFilterResult {
  normalizedSearchQuery: string;
  activeSearchFilters: MarketplaceActiveFilterItem[];
  clearSearch: () => void;
}

export function useMarketplaceSearchFilter({
  language,
  searchQuery,
  setSearchQuery,
}: UseMarketplaceSearchFilterParams): UseMarketplaceSearchFilterResult {
  const normalizedSearchQuery = searchQuery.trim();
  const clearSearch = () => setSearchQuery("");
  const activeSearchFilters = normalizedSearchQuery
    ? [
        {
          id: "search",
          label: normalizedSearchQuery,
          removeLabel:
            language === "ar"
              ? `إزالة فلتر البحث ${normalizedSearchQuery}`
              : `Remove search filter ${normalizedSearchQuery}`,
          onRemove: clearSearch,
        },
      ]
    : [];

  return {
    normalizedSearchQuery,
    activeSearchFilters,
    clearSearch,
  };
}

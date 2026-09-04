import { useCallback, useEffect, useState } from "react";
import type { SearchFilters } from "../components/searchFilterTypes";
import { useMarketplacePaginationNavigation } from "./useMarketplacePaginationNavigation";
import { useMarketplaceUrlState } from "./useMarketplaceUrlState";

type SortBy = NonNullable<SearchFilters["sortBy"]>;
type SortOrder = NonNullable<SearchFilters["sortOrder"]>;

interface MarketplaceResultsPageStateOptions {
  defaultSortBy?: SortBy;
  defaultSortOrder?: SortOrder;
}

export function useMarketplaceResultsPageState({
  defaultSortBy = "date",
  defaultSortOrder = "desc",
}: MarketplaceResultsPageStateOptions = {}) {
  const urlState = useMarketplaceUrlState({
    defaultSortBy,
    defaultSortOrder,
  });
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(
    urlState.filters,
  );
  const [showFilters, setShowFilters] = useState(false);
  const { navigateToPage, resultsHeadingRef } =
    useMarketplacePaginationNavigation(urlState.setPage);

  useEffect(() => {
    setDraftFilters(urlState.filters);
  }, [urlState.filters]);

  const applyDraftFilters = useCallback(() => {
    urlState.applyFilters(draftFilters);
    setShowFilters(false);
  }, [draftFilters, urlState]);

  const clearMobileFilters = useCallback(() => {
    setDraftFilters({
      sortBy: defaultSortBy,
      sortOrder: defaultSortOrder,
    });
    urlState.clearFilters();
    setShowFilters(false);
  }, [defaultSortBy, defaultSortOrder, urlState]);

  const toggleFilters = useCallback(() => {
    setShowFilters((currentValue) => !currentValue);
  }, []);

  return {
    ...urlState,
    draftFilters,
    setDraftFilters,
    showFilters,
    applyDraftFilters,
    clearMobileFilters,
    toggleFilters,
    navigateToPage,
    resultsHeadingRef,
  };
}

interface MarketplacePageBoundsOptions {
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function useMarketplacePageBounds({
  isLoading,
  error,
  page,
  totalPages,
  setPage,
}: MarketplacePageBoundsOptions) {
  useEffect(() => {
    if (!isLoading && !error && page > totalPages) {
      setPage(totalPages);
    }
  }, [error, isLoading, page, setPage, totalPages]);
}

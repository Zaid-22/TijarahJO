import type { ViewMode } from "../../types";
import { usePaginatedResults } from "./usePaginatedResults";

interface UseMarketplaceDiscoveryStateParams<T> {
  items: T[];
  itemsPerPage?: number;
  defaultViewMode?: ViewMode;
  storageKey?: string; // Kept for backwards compatibility if needed elsewhere
}

export function useMarketplaceDiscoveryState<T>({
  items,
  itemsPerPage = 12,
  defaultViewMode = "grid-4",
}: UseMarketplaceDiscoveryStateParams<T>) {
  const {
    displayedResults,
    shouldShowPagination,
    pagination,
  } = usePaginatedResults({
    items,
    itemsPerPage,
  });

  return {
    viewMode: defaultViewMode,
    displayedResults,
    shouldShowPagination,
    pagination,
  };
}

import type { ViewMode } from "../../types";
import { usePaginatedResults } from "./usePaginatedResults";

interface UseMarketplaceDiscoveryStateParams<T> {
  items: T[];
  itemsPerPage?: number;
  defaultViewMode?: ViewMode;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  storageKey?: string; // Kept for backwards compatibility if needed elsewhere
}

export function useMarketplaceDiscoveryState<T>({
  items,
  itemsPerPage = 12,
  defaultViewMode = "grid-4",
  initialPage = 1,
  onPageChange,
}: UseMarketplaceDiscoveryStateParams<T>) {
  const {
    displayedResults,
    shouldShowPagination,
    pagination,
  } = usePaginatedResults({
    items,
    itemsPerPage,
    initialPage,
    onPageChange,
  });

  return {
    viewMode: defaultViewMode,
    displayedResults,
    shouldShowPagination,
    pagination,
  };
}

import type { ViewMode } from "../../types";
import { useMarketplaceViewMode } from "./useMarketplaceViewMode";
import { usePaginatedResults } from "./usePaginatedResults";

interface UseMarketplaceDiscoveryStateParams<T> {
  items: T[];
  itemsPerPage?: number;
  defaultViewMode?: ViewMode;
}

export function useMarketplaceDiscoveryState<T>({
  items,
  itemsPerPage = 12,
  defaultViewMode = "grid-4",
}: UseMarketplaceDiscoveryStateParams<T>) {
  const [viewMode, setViewMode] = useMarketplaceViewMode(defaultViewMode);
  const {
    displayedResults,
    shouldShowPagination,
    pagination,
  } = usePaginatedResults({
    items,
    itemsPerPage,
  });

  return {
    viewMode,
    setViewMode,
    displayedResults,
    shouldShowPagination,
    pagination,
  };
}

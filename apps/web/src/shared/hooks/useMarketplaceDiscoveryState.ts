import type { ViewMode } from "../../types";
import { useMarketplaceViewMode } from "./useMarketplaceViewMode";
import { usePaginatedResults } from "./usePaginatedResults";

interface UseMarketplaceDiscoveryStateParams<T> {
  items: T[];
  itemsPerPage?: number;
  defaultViewMode?: ViewMode;
  storageKey?: string;
}

export function useMarketplaceDiscoveryState<T>({
  items,
  itemsPerPage = 12,
  defaultViewMode = "grid-4",
  storageKey,
}: UseMarketplaceDiscoveryStateParams<T>) {
  const [viewMode, setViewMode] = useMarketplaceViewMode(defaultViewMode, storageKey);
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

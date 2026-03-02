import { useInfiniteScroll } from "./useInfiniteScroll";

interface UsePaginatedResultsParams<T> {
  items: T[];
  itemsPerPage?: number;
}

interface PaginatedResultsState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

interface UsePaginatedResultsReturn<T> {
  displayedResults: T[];
  shouldShowPagination: boolean;
  pagination: PaginatedResultsState;
}

export function usePaginatedResults<T>({
  items,
  itemsPerPage = 12,
}: UsePaginatedResultsParams<T>): UsePaginatedResultsReturn<T> {
  const {
    displayedItems,
    isLoading,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
  } = useInfiniteScroll({
    items,
    itemsPerPage,
  });

  return {
    displayedResults: displayedItems,
    shouldShowPagination: displayedItems.length > 0,
    pagination: {
      currentPage,
      totalPages,
      isLoading,
      onPrevious: goToPreviousPage,
      onNext: goToNextPage,
    },
  };
}

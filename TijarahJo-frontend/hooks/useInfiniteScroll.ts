import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps<T> {
  items: T[];
  itemsPerPage?: number;
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  hasMore: boolean;
  isLoading: boolean;
  loadMoreRef: React.MutableRefObject<HTMLDivElement | null>;
  handleLoadMore: () => void;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

export function useInfiniteScroll<T>({ items, itemsPerPage = 12 }: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Reset when items change
  useEffect(() => {
    const initialItems = items.slice(0, itemsPerPage);
    setDisplayedItems(initialItems);
    setPage(1);
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  // Load items for a specific page
  const loadPage = useCallback((pageNumber: number) => {
    if (isLoading) return;

    setIsLoading(true);
    
    // Simulate loading delay for smoother UX
    setTimeout(() => {
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = pageNumber * itemsPerPage;
      const pageItems = items.slice(startIndex, endIndex);
      
      setDisplayedItems(pageItems);
      setPage(pageNumber);
      setHasMore(endIndex < items.length);
      setIsLoading(false);
      
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [items, itemsPerPage, isLoading]);

  // Load more items (for backward compatibility)
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    loadPage(page + 1);
  }, [page, hasMore, isLoading, loadPage]);

  // Manual load more function (for button click)
  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // Go to specific page
  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    loadPage(pageNumber);
  }, [totalPages, loadPage]);

  // Go to next page
  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      loadPage(page + 1);
    }
  }, [page, totalPages, loadPage]);

  // Go to previous page
  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      loadPage(page - 1);
    }
  }, [page, loadPage]);

  // Set up intersection observer for infinite scroll (disabled for pagination mode)
  useEffect(() => {
    // Disable auto-loading when using pagination
    // The observer is kept for potential future use but won't trigger loadMore
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMoreRef,
    handleLoadMore,
    currentPage: page,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };
}
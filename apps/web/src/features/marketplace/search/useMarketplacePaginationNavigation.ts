import { useCallback, useRef } from "react";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";

export function useMarketplacePaginationNavigation(
  setPage: (page: number) => void,
) {
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const navigateToPage = useCallback(
    (page: number) => {
      setPage(page);
      window.requestAnimationFrame(() => {
        resultsHeadingRef.current?.focus({ preventScroll: true });
        resultsHeadingRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    },
    [prefersReducedMotion, setPage],
  );

  return { navigateToPage, resultsHeadingRef };
}

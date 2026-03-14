import { useLayoutEffect, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll position on route change and disables
 * browser‑native scroll restoration.
 */
export function useScrollReset() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);
}

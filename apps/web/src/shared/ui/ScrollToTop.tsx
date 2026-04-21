import { useState, useEffect } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { cn } from "./utils";

interface ScrollToTopProps {
  avoidBottomOverlay?: boolean;
}

export function ScrollToTop({ avoidBottomOverlay = false }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollTarget = document.documentElement || document.body;
    scrollTarget.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    // Fallback for some browsers
    if (window.scrollY !== 0) {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-6 z-[150] hidden transition-all duration-300 sm:block sm:right-8",
        avoidBottomOverlay ? "bottom-72 sm:bottom-40 lg:bottom-32" : "bottom-24 sm:bottom-28",
      )}
    >
      <button
        onClick={scrollToTop}
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:-translate-y-1"
        aria-label="Scroll to top"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
        >
          <path
            d="M12 19V5m0 0-6 6m6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import type { Language } from "../../../types";
import {
  resolveCategoryIcon,
  resolveCategoryTextClass,
  resolveCategorySwatchClass,
} from "../../../shared/lib/categoryVisuals";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";

type HomeCategoriesSectionProps = {
  language: Language;
  t: Record<string, string>;
  getCategoryTranslation: (name: string) => string;
  setSelectedCategoryForPage: (category: string) => void;
  setShowAllPosts: (show: boolean) => void;
};

export function HomeCategoriesSection({
  language,
  t,
  getCategoryTranslation,
  setSelectedCategoryForPage,
  setShowAllPosts,
}: HomeCategoriesSectionProps) {
  const { categories } = useCatalogCategories();
  const isRTL = language === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 4;
    if (isRTL) {
      setCanScrollRight(el.scrollLeft < -threshold);
      setCanScrollLeft(
        el.scrollLeft > -(el.scrollWidth - el.clientWidth) + threshold,
      );
    } else {
      setCanScrollLeft(el.scrollLeft > threshold);
      setCanScrollRight(
        el.scrollLeft < el.scrollWidth - el.clientWidth - threshold,
      );
    }
  }, [isRTL]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, categories.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {t.categoriesTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.categoriesSubtitle}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="group text-primary transition-all duration-200 hover:bg-primary/10"
          onClick={() => setShowAllPosts(true)}
        >
          <span className={isRTL ? "ml-1.5" : "mr-1.5"}>{t.viewAll}</span>
          <svg
            className={`h-4 w-4 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>

      {/* Scrollable Categories */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-1/2"
            aria-label={language === "ar" ? "التمرير لليسار" : "Scroll left"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-1/2"
            aria-label={language === "ar" ? "التمرير لليمين" : "Scroll right"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => {
            const Icon = resolveCategoryIcon(category.icon);
            const textClass = resolveCategoryTextClass(category.color);
            const bgClass = resolveCategorySwatchClass(category.color);
            const categoryLabel =
              language === "ar"
                ? category.nameAr.trim() ||
                  getCategoryTranslation(category.name)
                : category.name;

            return (
              <button
                key={`category-${String(category.id || category.name).toLowerCase()}`}
                type="button"
                onClick={() => setSelectedCategoryForPage(category.name)}
                className="group flex flex-col items-center gap-3 flex-shrink-0 snap-start w-[80px] sm:w-[100px] transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Circular Icon */}
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${bgClass}/10 dark:${bgClass}/20 border-2 border-transparent group-hover:border-primary/30 transition-all duration-300 shadow-sm group-hover:shadow-md`}
                >
                  <Icon
                    className={`h-7 w-7 sm:h-8 sm:w-8 ${textClass} transition-transform duration-300 group-hover:scale-110`}
                  />
                </div>
                {/* Label */}
                <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2 leading-tight">
                  {categoryLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

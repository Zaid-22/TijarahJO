import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import type { Language } from "../../../types";
import { resolveCategoryIcon } from "../../../shared/lib/categoryVisuals";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";

/**
 * Maps category icon keys to curated gradient pairs.
 * Each category gets a unique, visually distinct gradient so the
 * horizontal carousel feels vibrant without relying on emojis.
 */
const GRADIENT_BY_ICON: Record<string, { from: string; to: string }> = {
  camera: { from: "from-rose-500", to: "to-pink-400" },
  smartphone: { from: "from-sky-500", to: "to-blue-400" },
  monitor: { from: "from-indigo-500", to: "to-violet-400" },
  refrigerator: { from: "from-teal-500", to: "to-cyan-400" },
  armchair: { from: "from-amber-500", to: "to-yellow-400" },
  car: { from: "from-slate-600", to: "to-zinc-500" },
  "shopping-bag": { from: "from-fuchsia-500", to: "to-pink-400" },
  sparkles: { from: "from-pink-500", to: "to-rose-400" },
  dumbbell: { from: "from-emerald-500", to: "to-green-400" },
  "book-open": { from: "from-orange-500", to: "to-amber-400" },
  "gamepad-2": { from: "from-violet-500", to: "to-purple-400" },
  home: { from: "from-blue-600", to: "to-sky-400" },
  "paw-print": { from: "from-lime-500", to: "to-green-400" },
  wrench: { from: "from-gray-600", to: "to-slate-400" },
  package: { from: "from-cyan-500", to: "to-blue-400" },
  box: { from: "from-cyan-500", to: "to-blue-400" },
};

const DEFAULT_GRADIENT = { from: "from-primary", to: "to-secondary" };

function resolveGradient(icon: string | undefined): {
  from: string;
  to: string;
} {
  if (!icon) return DEFAULT_GRADIENT;
  const key = icon
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  return GRADIENT_BY_ICON[key] || DEFAULT_GRADIENT;
}

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
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
        >
          {categories.map((category) => {
            const Icon = resolveCategoryIcon(category.icon);
            const gradient = resolveGradient(category.icon);
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
                className="group flex flex-col items-center gap-2.5 flex-shrink-0 snap-start w-[88px] sm:w-[104px] transition-transform duration-200 hover:-translate-y-1.5"
              >
                {/* Gradient Icon Card */}
                <div
                  className={`relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-2xl bg-gradient-to-br ${gradient.from} ${gradient.to} flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                >
                  {/* Glassmorphism inner glow */}
                  <div className="absolute inset-1 rounded-[13px] bg-white/15 dark:bg-white/10 backdrop-blur-sm" />
                  <Icon
                    className="relative z-10 h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.75}
                  />
                </div>
                {/* Label */}
                <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
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

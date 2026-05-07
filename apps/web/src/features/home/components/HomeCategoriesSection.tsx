import { useId } from "react";
import type { Language } from "../../../types";
import type { Category } from "../../../types/api";
import { getResponsiveImageProps } from "../../../shared/lib/thumbnail";

type HomeCategoriesSectionProps = {
  language: Language;
  t: Record<string, string>;
  categories: Category[];
  isLoading: boolean;
  getCategoryTranslation: (name: string) => string;
  setSelectedCategoryForPage: (category: string) => void;
  setShowAllPosts: (show: boolean) => void;
};

export function HomeCategoriesSection({
  language,
  t,
  categories,
  isLoading,
  getCategoryTranslation,
  setSelectedCategoryForPage,
}: HomeCategoriesSectionProps) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 [content-visibility:auto] [contain-intrinsic-size:560px]"
    >
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2
          id={headingId}
          className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
        >
          {t.categoriesTitle}
        </h2>
        <p
          id={descriptionId}
          className="text-muted-foreground"
        >
          {t.categoriesSubtitle}
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`cat-skeleton-${i}`}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card aspect-4/3 animate-pulse"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
                   <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="mt-3 w-16 h-3 sm:h-4 bg-muted rounded" />
              </div>
            ))
          : categories.map((category, index) => {
              const categoryLabel =
                language === "ar"
                  ? category.nameAr?.trim() ||
                    getCategoryTranslation(category.name)
                  : category.name;

              const hasImage = category.image && category.image.trim().length > 0;
              const prioritizeImage = index === 0;
              const categoryImageProps = getResponsiveImageProps(category.image, {
                width: 480,
                aspectRatio: 4 / 3,
                quality: 58,
                widths: [220, 320, 400, 480],
                sizes:
                  "(max-width: 639px) 44vw, (max-width: 767px) 29vw, (max-width: 1023px) 22vw, (max-width: 1279px) 18vw, 15vw",
              });

              return (
                <button
                  key={`category-${String(category.id || category.name).toLowerCase()}`}
                  type="button"
                  aria-label={categoryLabel}
                  onClick={() => setSelectedCategoryForPage(category.name)}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aspect-4/3"
                >
                  {hasImage ? (
                    /* Database image */
                    <>
                      <img
                        src={categoryImageProps.src || category.image}
                        srcSet={categoryImageProps.srcSet}
                        alt=""
                        aria-hidden="true"
                        width={320}
                        height={240}
                        loading={prioritizeImage ? "eager" : "lazy"}
                        decoding="async"
                        {...{
                          fetchpriority: prioritizeImage ? "high" : "auto",
                        }}
                        sizes={categoryImageProps.sizes}
                        className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src !== category.image) {
                            img.srcset = "";
                            img.src = category.image;
                          }
                        }}
                      />
                      {/* Subtle bottom gradient scrim — only covers bottom ~35% */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/50 via-black/20 to-transparent" />
                      {/* Compact label anchored bottom-left */}
                      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end px-3 pb-2.5 sm:px-3.5 sm:pb-3">
                        <span className="text-[13px] font-semibold leading-snug tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-sm">
                          {categoryLabel}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* Fallback: icon-based card */
                    <CategoryIconFallback
                      label={categoryLabel}
                    />
                  )}
                </button>
              );
            })}
      </div>
    </section>
  );
}

/**
 * Fallback category display using Lucide icons + gradient
 * when no database image is available.
 */
function CategoryIconFallback({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex h-full w-full items-end bg-linear-to-br from-primary/8 via-background to-secondary/8 p-4 sm:p-5">
      <span className="text-sm sm:text-base font-semibold text-foreground text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200 w-full">
        {label}
      </span>
    </div>
  );
}

import type { Language } from "../../../types";
import { resolveCategoryIcon } from "../../../shared/lib/categoryVisuals";
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
}: HomeCategoriesSectionProps) {
  const { categories, isLoading } = useCatalogCategories();

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t.categoriesTitle}
        </h2>
        <p className="text-muted-foreground">
          {t.categoriesSubtitle}
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`cat-skeleton-${i}`}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card aspect-[4/3] animate-pulse"
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

              const delayClass = [
                "animate-delay-[0ms]", "animate-delay-[50ms]", "animate-delay-[100ms]", 
                "animate-delay-[150ms]", "animate-delay-[200ms]", "animate-delay-[250ms]", 
                "animate-delay-[300ms]", "animate-delay-[350ms]", "animate-delay-[400ms]", 
                "animate-delay-[450ms]", "animate-delay-[500ms]"
              ][Math.min(index, 10)];

              return (
                <button
                  key={`category-${String(category.id || category.name).toLowerCase()}`}
                  type="button"
                  onClick={() => setSelectedCategoryForPage(category.name)}
                  className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up aspect-[4/3] ${delayClass}`}
                >
                  {hasImage ? (
                    /* Database image */
                    <>
                      <img
                        src={category.image}
                        alt={categoryLabel}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Dark overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 transition-all duration-300" />
                      {/* Label over image */}
                      <span className="relative z-10 mt-auto pb-3 px-2 text-sm sm:text-base font-bold text-white text-center line-clamp-2 leading-tight drop-shadow-lg">
                        {categoryLabel}
                      </span>
                    </>
                  ) : (
                    /* Fallback: icon-based card */
                    <CategoryIconFallback
                      iconKey={category.icon}
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
  iconKey,
  label,
}: {
  iconKey: string;
  label: string;
}) {
  const Icon = resolveCategoryIcon(iconKey);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 dark:from-primary/25 dark:to-secondary/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon
          className="h-7 w-7 sm:h-8 sm:w-8 text-primary"
          strokeWidth={1.75}
        />
      </div>
      <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
        {label}
      </span>
    </div>
  );
}

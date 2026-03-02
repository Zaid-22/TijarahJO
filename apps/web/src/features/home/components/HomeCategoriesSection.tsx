import { Button } from "../../../shared/ui/button";
import type { Language } from "../../../types";
import { categoryImageFallback } from "../../../shared/lib/categoryVisuals";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";

const CATEGORY_ANIMATION_DELAY_CLASSES = [
  "anim-delay-0",
  "anim-delay-100",
  "anim-delay-200",
  "anim-delay-300",
  "anim-delay-400",
  "anim-delay-500",
  "anim-delay-600",
  "anim-delay-700",
  "anim-delay-800",
  "anim-delay-900",
] as const;

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

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/15 dark:bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="mb-2 text-foreground">{t.categoriesTitle}</h2>
          <p className="text-muted-foreground">{t.categoriesSubtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="group text-primary shadow-sm transition-all duration-200 hover:bg-primary/10 hover:shadow-md"
          onClick={() => setShowAllPosts(true)}
        >
          <span className={isRTL ? "ml-2" : "mr-2"}>{t.viewAll}</span>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {categories.map((category, index) => {
          const animationDelayClass =
            CATEGORY_ANIMATION_DELAY_CLASSES[
              index % CATEGORY_ANIMATION_DELAY_CLASSES.length
            ];
          const categoryLabel =
            language === "ar"
              ? category.nameAr.trim() || getCategoryTranslation(category.name)
              : category.name;
          return (
            <button
              key={`category-${String(category.id || category.name).toLowerCase()}`}
              type="button"
              onClick={() => {
                setSelectedCategoryForPage(category.name);
              }}
              className={`group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 aspect-[4/3] animate-fade-in-soft ${animationDelayClass}`}
            >
              <div className="absolute inset-0">
                <img
                  src={category.image || categoryImageFallback}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex items-end p-4 sm:p-5">
                <div className="text-primary-foreground transition-all duration-300 text-sm sm:text-base font-semibold drop-shadow-lg">
                  {categoryLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

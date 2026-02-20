import { categoryData } from "../../../data/categoryData";
import { Button } from "../../../shared/ui/button";

type HomeCategoriesSectionProps = {
  t: Record<string, string>;
  getCategoryTranslation: (name: string) => string;
  setSelectedCategoryForPage: (category: string) => void;
  setShowAllProducts: (show: boolean) => void;
};

export function HomeCategoriesSection({
  t,
  getCategoryTranslation,
  setSelectedCategoryForPage,
  setShowAllProducts,
}: HomeCategoriesSectionProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/40 dark:bg-blue-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/30 dark:bg-purple-950/20 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-black dark:text-white mb-2">{t.categoriesTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t.categoriesSubtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="group hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:text-[#3E7EFF] transition-all duration-200 shadow-sm hover:shadow-md text-[#0A4ABF]"
          onClick={() => setShowAllProducts(true)}
        >
          <span className="mr-2">{t.viewAll}</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
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
        {categoryData.map((category, index) => {
          return (
            <button
              key={`category-${category.name}-${index}`}
              type="button"
              onClick={() => {
                setSelectedCategoryForPage(category.name);
              }}
              className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 aspect-[4/3] animate-fade-in [animation-duration:0.6s] [animation-timing-function:ease-out] [animation-fill-mode:both]"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="absolute inset-0">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              <div className="relative z-10 h-full flex items-end p-4 sm:p-5">
                <div className="text-white transition-all duration-300 text-sm sm:text-base font-semibold drop-shadow-lg">
                  {getCategoryTranslation(category.name)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

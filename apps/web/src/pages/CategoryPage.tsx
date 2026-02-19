import { Button } from "../shared/ui/button";
import { ProductCard } from "../features/marketplace/components/ProductCard";

import { Language } from "../translations";
import { Product } from "../types";
import { categoryData } from "../data/categoryData";
import { useInfiniteScroll } from "../shared/hooks/useInfiniteScroll";
import {
  Search,
  Grid3x3,
  LayoutGrid,
  List,
  Columns,
  Loader2,
  ChevronRight,
  ArrowUpDown,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { useState, useMemo } from "react";

interface CategoryPageProps {
  categoryName: string;
  onBack: () => void;
  products: Product[];
  onProductClick: (productId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (productId: string) => void;
  language: Language;
  currentUserDisplayName?: string;
  currentUserId?: string;
  isAuthenticated?: boolean;
}

export function CategoryPage({
  categoryName,
  onBack,
  products,
  onProductClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  currentUserDisplayName,
  currentUserId,
  isAuthenticated = false,
}: CategoryPageProps) {
  // const t = translations[language];
  const isRTL = language === "ar";

  const [viewMode, setViewMode] = useState<
    "grid-4" | "grid-3" | "grid-2" | "list"
  >("grid-4");
  const [sortBy, setSortBy] = useState<
    | "newest"
    | "oldest"
    | "price-low"
    | "price-high"
    | "most-viewed"
    | "name-az"
    | "name-za"
  >("newest");

  const currentCategory = categoryData.find((cat) => cat.name === categoryName);
  const CategoryIcon = currentCategory?.icon || Search;
  const categoryColor = currentCategory?.color || "#0A4ABF";

  const filteredProducts = useMemo(() => {
    const normalizedCategoryName = categoryName.trim().toLowerCase();
    const categoryProducts = products.filter(
      (p) =>
        p.category.trim().toLowerCase() === normalizedCategoryName &&
        p.status !== "SOLD" &&
        p.status !== "DELETED",
    );
    return categoryProducts;
  }, [products, categoryName]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA && dateB) return dateB - dateA;
          return b.id.localeCompare(a.id);
        });
        break;
      case "oldest":
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA && dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });
        break;
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "most-viewed":
        sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "name-az":
        sorted.sort((a, b) =>
          a.name.localeCompare(b.name, language === "ar" ? "ar" : "en"),
        );
        break;
      case "name-za":
        sorted.sort((a, b) =>
          b.name.localeCompare(a.name, language === "ar" ? "ar" : "en"),
        );
        break;
      default:
        break;
    }

    return sorted;
  }, [filteredProducts, sortBy, language]);

  const {
    displayedItems,
    isLoading,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  } = useInfiniteScroll({
    items: sortedProducts,
    itemsPerPage: 12,
  });

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Category Header */}
      <section className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2 rounded-xl h-10 px-3 text-primary"
            >
              <ArrowLeft
                className={`w-5 h-5 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`}
              />
              <span className="font-semibold">
                {language === "ar" ? "العودة" : "Back"}
              </span>
            </Button>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <CategoryIcon
                className="w-8 h-8"
                style={{ color: categoryColor }}
              />
            </div>
            <div>
              <h1 className="text-2xl text-gray-900 dark:text-white">
                {language === "ar"
                  ? currentCategory?.nameAr || categoryName
                  : categoryName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "ar"
                  ? `تصفح جميع ${currentCategory?.nameAr || categoryName}`
                  : `Browse all ${categoryName.toLowerCase()}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A4ABF] dark:focus:ring-[#3E7EFF] cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <option value="newest">
                {language === "ar" ? "الأحدث" : "Newest"}
              </option>
              <option value="oldest">
                {language === "ar" ? "الأقدم" : "Oldest"}
              </option>
              <option value="price-low">
                {language === "ar"
                  ? "السعر: من الأقل للأعلى"
                  : "Price: Low to High"}
              </option>
              <option value="price-high">
                {language === "ar"
                  ? "السعر: من الأعلى للأقل"
                  : "Price: High to Low"}
              </option>
              <option value="most-viewed">
                {language === "ar" ? "الأكثر مشاهدة" : "Most Viewed"}
              </option>
              <option value="name-az">
                {language === "ar" ? "الاسم: أ-ي" : "Name: A-Z"}
              </option>
              <option value="name-za">
                {language === "ar" ? "الاسم: ي-أ" : "Name: Z-A"}
              </option>
            </select>
          </div>

          {/* View Mode - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-4")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-4" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="4 columns"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-3")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-3" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="3 columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-2")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-2" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="2 columns"
            >
              <Columns className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 p-0 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          className={`grid ${
            viewMode === "grid-4"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : viewMode === "grid-3"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : viewMode === "grid-2"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1"
          } gap-4 sm:gap-5 md:gap-6`}
        >
          {displayedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-black dark:text-white mb-2">
                {language === "ar" ? "لا توجد نتائج" : "No results found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {language === "ar"
                  ? "لا توجد منشورات متاحة في هذه الفئة"
                  : "No posts available in this category"}
              </p>
            </div>
          ) : (
            displayedItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                viewMode={viewMode}
                isFavorite={favoriteIds.includes(product.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={isAuthenticated ? currentUserId : undefined}
                currentUserDisplayName={
                  isAuthenticated ? currentUserDisplayName || "" : undefined
                }
                hideCategoryBadge={true}
              />
            ))
          )}
        </div>

        {displayedItems.length > 0 && totalPages > 1 && (
          <div className="mt-12 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || isLoading}
                className={`px-6 py-3 rounded-xl disabled:opacity-50 ${currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-primary text-white"}`}
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft
                    className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`}
                  />
                  <span>{language === "ar" ? "السابق" : "Previous"}</span>
                </div>
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        currentPage === pageNum
                          ? "bg-gray-900 dark:bg-gray-700 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || isLoading}
                className="px-6 py-3 rounded-xl disabled:opacity-50 transition-all hover:opacity-90 bg-primary text-white"
              >
                <div className="flex items-center gap-2">
                  <span>{language === "ar" ? "التالي" : "Next"}</span>
                  <ChevronRight
                    className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`}
                  />
                </div>
              </Button>
            </div>

            <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              {language === "ar"
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </main>
    </div>
  );
}

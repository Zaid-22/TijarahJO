import {
  Search,
  Loader2,
  Grid3x3,
  LayoutGrid,
  Columns,
  List,
} from "lucide-react";
import { Button } from "../shared/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../shared/ui/pagination";
import { ProductCard } from "../features/marketplace/components/ProductCard";
import { Language, Product, ViewMode } from "../types";
import { APP_CONFIG } from "../constants/appConfig";
import { useMemo } from "react";
import { HomeHeroSection } from "../features/home/components/HomeHeroSection";
import { HomeCategoriesSection } from "../features/home/components/HomeCategoriesSection";

interface HomePageProps {
  language: Language;
  isAuthenticated: boolean;
  t: Record<string, string>;
  isRTL: boolean;
  darkMode: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Navigation / Actions
  setShowLoginPrompt: (show: boolean) => void;
  setShowSellItem: (show: boolean) => void;
  setShowAllProducts: (show: boolean) => void;
  setSelectedCategoryForPage: (category: string) => void;

  // Data
  isLoadingProducts: boolean;
  productsError: string | null;
  displayedItems: Product[];

  // View Control
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Product Actions
  onProductClick: (id: string, origin?: string) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  currentUserDisplayName: string;
  currentUserId?: string;

  // Pagination
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;

  // Helpers
  getCategoryTranslation: (name: string) => string;
}

export function HomePage({
  language,
  isAuthenticated,
  t,
  isRTL,
  darkMode,
  searchQuery,
  setSearchQuery,
  setShowLoginPrompt,
  setShowSellItem,
  setShowAllProducts,
  setSelectedCategoryForPage,
  isLoadingProducts,
  productsError,
  displayedItems,
  viewMode,
  setViewMode,
  onProductClick,
  favoriteIds,
  toggleFavorite,
  currentUserDisplayName,
  currentUserId,
  currentPage,
  totalPages,
  isLoading,
  goToNextPage,
  goToPreviousPage,
  getCategoryTranslation,
}: HomePageProps) {
  const backendUrlHint = APP_CONFIG.backendHostUrl;
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const scrollToTop = () => {
    const mainContent = document.querySelector("main");
    mainContent?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <HomeHeroSection
        language={language}
        isAuthenticated={isAuthenticated}
        t={t}
        isRTL={isRTL}
        darkMode={darkMode}
        setShowLoginPrompt={setShowLoginPrompt}
        setShowSellItem={setShowSellItem}
        onBrowseItems={scrollToTop}
      />
      <HomeCategoriesSection
        t={t}
        getCategoryTranslation={getCategoryTranslation}
        setSelectedCategoryForPage={setSelectedCategoryForPage}
        setShowAllProducts={setShowAllProducts}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Controls Only */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-4")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-4"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-[#0A4ABF]"
                      : "text-[#6B7280]"
                  }`}
                  title="4 Columns Grid"
                  aria-label="4 Columns Grid"
                >
                  <Grid3x3 className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-3")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-3"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-[#0A4ABF]"
                      : "text-[#6B7280]"
                  }`}
                  title="3 Columns Grid"
                  aria-label="3 Columns Grid"
                >
                  <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-2")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-2"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-[#0A4ABF]"
                      : "text-[#6B7280]"
                  }`}
                  title="2 Columns Grid"
                  aria-label="2 Columns Grid"
                >
                  <Columns className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-blue-50 dark:bg-blue-900/30 text-[#0A4ABF]"
                      : "text-[#6B7280]"
                  }`}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProducts && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4 animate-spin" />
            <h3 className="text-black dark:text-white mb-2">
              {language === "ar"
                ? "جارٍ تحميل المنتجات..."
                : "Loading products..."}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              {language === "ar"
                ? "جاري جلب البيانات من قاعدة البيانات"
                : "Fetching data from database"}
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingProducts && productsError && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              {productsError}
            </p>
            {productsError.includes("Cannot connect") && (
              <p className="text-yellow-700 dark:text-yellow-300 text-xs text-center mt-2">
                {language === "ar"
                  ? `تأكد من تشغيل الخادم الخلفي على ${backendUrlHint}`
                  : `Make sure the backend server is running on ${backendUrlHint}`}
              </p>
            )}
          </div>
        )}

        {/* Product Grid */}
        {!isLoadingProducts && (
          <div
            className={`grid ${
              viewMode === "grid-4"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : viewMode === "grid-3"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : viewMode === "grid-2"
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
            } gap-4 sm:gap-5 md:gap-6 transition-all duration-300`}
          >
            {displayedItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-black dark:text-white mb-2">
                  {searchQuery
                    ? language === "ar"
                      ? "لا توجد نتائج"
                      : "No results found"
                    : language === "ar"
                      ? "لا توجد منتجات"
                      : "No products found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  {searchQuery
                    ? language === "ar"
                      ? `لم نتمكن من العثور على أي منتجات تطابق "${searchQuery}"`
                      : `We couldn't find any products matching "${searchQuery}"`
                    : language === "ar"
                      ? "جرب فئة أخرى أو أضف منتجات جديدة"
                      : "Try a different category or add new products"}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 bg-[#0A4ABF] text-white hover:bg-[#083a99]"
                  >
                    {language === "ar" ? "مسح البحث" : "Clear Search"}
                  </Button>
                )}
              </div>
            ) : (
              displayedItems.map((product) => (
                <ProductCard
                  key={
                    product.id
                      ? `product-${product.id}`
                      : `product-fallback-${String(
                          product.name || "item",
                        ).trim().toLowerCase()}-${String(product.sellerId || product.seller || "unknown").trim().toLowerCase()}-${String(product.createdAt || "created")}`
                  }
                  product={product}
                  onProductClick={(id) => onProductClick(id, "marketplace")}
                  viewMode={viewMode}
                  isFavorite={favoriteIdSet.has(product.id)}
                  onFavoriteToggle={toggleFavorite}
                  isAuthenticated={isAuthenticated}
                  currentUserId={isAuthenticated ? currentUserId : undefined}
                  currentUserDisplayName={
                    isAuthenticated ? currentUserDisplayName : undefined
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {displayedItems.length > 0 && totalPages > 1 && (
          <div className="mt-12 mb-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1 || isLoading}
                  />
                </PaginationItem>

                {/* Simply show current page / total */}
                <PaginationItem>
                  <PaginationLink isActive>
                    {currentPage} / {totalPages}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages || isLoading}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Loading Indicator for pagination */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2
                className="w-6 h-6 animate-spin text-[#0A4ABF]"
              />
              <span className="text-gray-600 dark:text-gray-400">
                {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
              </span>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

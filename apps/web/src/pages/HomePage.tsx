import {
  Search,
  Loader2,
  Grid3x3,
  LayoutGrid,
  Columns,
  List,
  User,
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
import { categoryData } from "../data/categoryData";
import { Language, Product, ViewMode } from "../types";
import { APP_CONFIG } from "../constants/appConfig";

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

  const scrollToTop = () => {
    const mainContent = document.querySelector("main");
    mainContent?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      {/* Hero Banner */}
      <section
        className="relative py-16 px-4 overflow-hidden"
        style={{
          background: darkMode
            ? "linear-gradient(135deg, #0A4ABF 0%, #1a5fd9 100%)"
            : "linear-gradient(135deg, #0A4ABF 0%, #3E7EFF 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3E7EFF]/20 dark:bg-[#3E7EFF]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center text-white">
          <h2 className="mb-4 text-base sm:text-lg font-medium animate-fade-in">
            {t.heroTitle}
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 max-w-2xl mx-auto animate-fade-in">
            {t.heroSubtitle}
          </p>

          {/* Sign In Message for Unauthenticated Users */}
          {!isAuthenticated && (
            <div className="mb-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 max-w-2xl mx-auto animate-fade-in shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <User className="w-6 h-6 text-white" />
                <h3 className="text-xl text-white">
                  {language === "ar"
                    ? "ابدأ البيع اليوم"
                    : "Start Selling Today"}
                </h3>
              </div>
              <p className="text-white/90 mb-6">
                {language === "ar"
                  ? "انشر منتجاتك واصل إلى المشترين في جميع أنحاء الأردن"
                  : "Post your items and reach buyers across Jordan"}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  size="lg"
                  className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: "white",
                    color: "#0A4ABF",
                  }}
                  onClick={() => {
                    setShowLoginPrompt(true);
                  }}
                >
                  <User className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "ابدأ البيع" : "Start Selling"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                  style={{
                    borderColor: "white",
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderWidth: "2px",
                  }}
                  onClick={scrollToTop}
                >
                  {t.browseItems}
                </Button>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="flex gap-4 justify-center flex-wrap animate-fade-in">
              <Button
                size="lg"
                className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: "white",
                  color: "#0A4ABF",
                }}
                onClick={() => setShowSellItem(true)}
              >
                {t.startSelling}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:scale-105 transition-transform shadow-lg hover:bg-white/20 dark:hover:bg-white/10"
                style={{
                  borderColor: "white",
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderWidth: "2px",
                }}
                onClick={scrollToTop}
              >
                {t.browseItems}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/40 dark:bg-blue-950/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/30 dark:bg-purple-950/20 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-black dark:text-white mb-2">
              {t.categoriesTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t.categoriesSubtitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="group hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:text-[#3E7EFF] transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ color: "#0A4ABF" }}
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
                className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 aspect-[4/3]"
                style={{
                  animationName: "fadeIn",
                  animationDuration: "0.6s",
                  animationTimingFunction: "ease-out",
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "both",
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content */}
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
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-4" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="4 Columns Grid"
                >
                  <Grid3x3 className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-3")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-3"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-3" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="3 Columns Grid"
                >
                  <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-2")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-2"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-2" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="2 Columns Grid"
                >
                  <Columns className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "list" ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  style={{
                    color: viewMode === "list" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="List View"
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
                    className="mt-4"
                    style={{
                      backgroundColor: "#0A4ABF",
                      color: "white",
                    }}
                  >
                    {language === "ar" ? "مسح البحث" : "Clear Search"}
                  </Button>
                )}
              </div>
            ) : (
              displayedItems.map((product, index) => (
                <ProductCard
                  key={
                    product.id
                      ? `product-${product.id}`
                      : `product-${index}-${
                          product.name?.substring(0, 10) || "item"
                        }`
                  }
                  product={product}
                  onProductClick={(id) => onProductClick(id, "marketplace")}
                  viewMode={viewMode}
                  isFavorite={favoriteIds.includes(product.id)}
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
                className="w-6 h-6 animate-spin"
                style={{ color: "#0A4ABF" }}
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

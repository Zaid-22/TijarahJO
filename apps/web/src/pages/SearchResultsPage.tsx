import { Button } from "../shared/ui/button";

import { ProductCard } from "../features/marketplace/components/ProductCard";

import { Language } from "../translations";
import { Product } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "../shared/hooks/useDebounce";
import { api } from "../services/api";
import { isActiveProduct, rankProductsBySearch } from "../lib/searchRanking";
import { APP_CONFIG } from "../constants/appConfig";
import { runSearchPipeline } from "../features/marketplace/search/searchPipeline";
import {
  Search,
  Grid3x3,
  LayoutGrid,
  List,
  Columns,
  ArrowLeft,
} from "lucide-react";

interface SearchResultsPageProps {
  searchQuery: string;
  products: Product[];
  onBack: () => void;
  onProductClick: (id: string) => void;
  language: Language;
  favoriteIds: string[];
  onFavoriteToggle: (id: string) => void;
  onSearch: (query: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string;
  currentUserId?: string;
}

export function SearchResultsPage({
  searchQuery: initialSearchQuery,
  products,
  onBack,
  onProductClick,
  language,
  favoriteIds,
  onFavoriteToggle,
  onSearch,
  isAuthenticated = false,
  currentUserDisplayName,
  currentUserId,
}: SearchResultsPageProps) {
  const [viewMode, setViewMode] = useState<
    "grid-4" | "grid-3" | "grid-2" | "list"
  >("grid-4");
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);
  const [searchResults, setSearchResults] = useState<Product[]>(() =>
    products.filter(isActiveProduct),
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  useEffect(() => {
    setLocalSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    let cancelled = false;
    const query = debouncedSearchQuery.trim();

    if (!query) {
      setSearchResults(products.filter(isActiveProduct));
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      const { products: nextResults, error } = await runSearchPipeline({
        request: () =>
          api.search.search({
            query,
            status: "ACTIVE",
            page: 1,
            limit: APP_CONFIG.search.searchResultsLimit,
            sortBy: "date",
            sortOrder: "desc",
          }),
        buildFallbackProducts: () => rankProductsBySearch(products, query),
        fallbackErrorMessage: "Search failed",
        transformRemoteProducts: (remoteProducts) =>
          rankProductsBySearch(remoteProducts, query),
      });

      if (cancelled) {
        return;
      }

      setSearchResults(nextResults);
      setSearchError(error);
      setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, products]);

  const filteredProducts = useMemo(() => {
    const query = debouncedSearchQuery.trim();
    return query ? searchResults : products.filter(isActiveProduct);
  }, [debouncedSearchQuery, searchResults, products]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      {/* Search Info - optional or keep? Global header has search bar. 
          But "Search results for X" is useful content. 
          Let's keep the Info bar but remove the Header component. 
      */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#0A4ABF] hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2 rounded-xl h-10 px-3"
          >
            <ArrowLeft
              className={`w-5 h-5 ${language === "ar" ? "ml-2 rotate-180" : "mr-2"}`}
            />
            <span className="font-semibold">
              {language === "ar" ? "العودة" : "Back"}
            </span>
          </Button>
          <h1 className="text-black dark:text-white">
            {language === "ar"
              ? `نتائج البحث عن "${localSearchQuery}"`
              : `Search results for "${localSearchQuery}"`}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isSearching && (
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {language === "ar" ? "جاري البحث..." : "Searching..."}
          </div>
        )}
        {searchError && !isSearching && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {searchError}
          </div>
        )}

        {/* View Controls - Hidden on mobile, shown on larger screens */}
        <div className="hidden sm:flex items-center justify-end mb-8">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-4")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-4" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="4 columns"
              aria-label="4 columns"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-3")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-3" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="3 columns"
              aria-label="3 columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-2")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-2" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="2 columns"
              aria-label="2 columns"
            >
              <Columns className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 p-0 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Product Grid */}
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
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-black dark:text-white mb-2">
                {language === "ar" ? "لا توجد نتائج" : "No results found"}
              </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  {language === "ar"
                    ? `لم نتمكن من العثور على أي منتجات تطابق "${localSearchQuery}"`
                    : `We couldn't find any products matching "${localSearchQuery}"`}
                </p>
              <Button
                onClick={() => {
                  setLocalSearchQuery("");
                  onSearch("");
                  onBack();
                }}
                className="mt-4 bg-[#0A4ABF] text-white hover:bg-[#083a95]"
              >
                {language === "ar" ? "العودة إلى السوق" : "Back to Marketplace"}
              </Button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                viewMode={viewMode}
                isFavorite={favoriteIdSet.has(product.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={isAuthenticated ? currentUserId : undefined}
                currentUserDisplayName={currentUserDisplayName}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

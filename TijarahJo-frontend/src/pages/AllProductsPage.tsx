import { Logo } from "../components/ui/logo";
import { Button } from "../components/ui/button";
import { ProductCard } from "../components/figma/ProductCard";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { translations, Language } from "../translations";
import { Product } from "../types";
import { api } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { isActiveProduct, rankProductsBySearch } from "../lib/searchRanking";
import { APP_CONFIG } from "../constants/appConfig";
import {
  ArrowLeft,
  Search,
  // Filter,
  Grid3x3,
  LayoutGrid,
  List,
  Columns,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface AllProductsPageProps {
  onBack: () => void;
  products: Product[];
  onProductClick: (productId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (productId: string) => void;
  language: Language;
  isAuthenticated?: boolean;
  darkMode?: boolean;
  currentUserDisplayName?: string;
}

export function AllProductsPage({
  onBack,
  products,
  onProductClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  isAuthenticated = false,
  darkMode = false,
  currentUserDisplayName,
}: AllProductsPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState<
    "grid-4" | "grid-3" | "grid-2" | "list"
  >("grid-4");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(() =>
    products.filter(isActiveProduct),
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilteredProducts(products.filter(isActiveProduct));
  }, [products]);

  useEffect(() => {
    let cancelled = false;

    const resolvePriceRange = (): { minPrice?: number; maxPrice?: number } => {
      switch (priceRange) {
        case "0-50":
          return { maxPrice: 50 };
        case "50-100":
          return { minPrice: 50.01, maxPrice: 100 };
        case "100-500":
          return { minPrice: 100.01, maxPrice: 500 };
        case "500+":
          return { minPrice: 500.01 };
        default:
          return {};
      }
    };

    const resolveSort = (): {
      sortBy: "date" | "price" | "views";
      sortOrder: "asc" | "desc";
    } => {
      if (sortBy === "price-low") {
        return { sortBy: "price", sortOrder: "asc" };
      }
      if (sortBy === "price-high") {
        return { sortBy: "price", sortOrder: "desc" };
      }

      return { sortBy: "date", sortOrder: "desc" };
    };

    const { minPrice, maxPrice } = resolvePriceRange();
    const sortConfig = resolveSort();
    const query = debouncedSearchQuery.trim();

    const sortByUiMode = (results: Product[]): Product[] => {
      if (sortBy === "price-low") {
        return [...results].sort((a, b) => Number(a.price) - Number(b.price));
      }
      if (sortBy === "price-high") {
        return [...results].sort((a, b) => Number(b.price) - Number(a.price));
      }
      if (sortBy === "name") {
        return [...results].sort((a, b) => a.name.localeCompare(b.name));
      }
      if (!query) {
        return [...results].sort((a, b) => {
          const timestampA = Date.parse(a.createdAt || "") || 0;
          const timestampB = Date.parse(b.createdAt || "") || 0;
          return timestampB - timestampA;
        });
      }
      return results;
    };

    const applyLocalFallback = (): Product[] => {
      let results = products.filter(isActiveProduct);
      if (query) {
        results = rankProductsBySearch(results, query);
      }
      if (typeof minPrice === "number") {
        results = results.filter((product) => Number(product.price) >= minPrice);
      }
      if (typeof maxPrice === "number") {
        results = results.filter((product) => Number(product.price) <= maxPrice);
      }
      return sortByUiMode(results);
    };

    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      try {
        const response = await api.search.search({
          query: query || undefined,
          minPrice,
          maxPrice,
          status: "ACTIVE",
          sortBy: sortConfig.sortBy,
          sortOrder: sortConfig.sortOrder,
          page: 1,
          limit: APP_CONFIG.search.allProductsLimit,
        });

        if (cancelled) {
          return;
        }

        if (!response.success) {
          const fallbackResults = applyLocalFallback();
          setFilteredProducts(fallbackResults);
          setSearchError(
            fallbackResults.length > 0
              ? null
              : response.error?.message || "Failed to fetch products",
          );
          return;
        }

        let results = response.posts.filter(isActiveProduct);
        if (query && sortBy === "recent") {
          results = rankProductsBySearch(results, query);
        }
        results = sortByUiMode(results);

        setFilteredProducts(results);
        setSearchError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error("All products search failed:", error);
        const fallbackResults = applyLocalFallback();
        setFilteredProducts(fallbackResults);
        setSearchError(
          fallbackResults.length > 0 ? null : "Failed to fetch products",
        );
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, priceRange, products, sortBy]);

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111111] shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={onBack}
                style={{ color: "#0A4ABF" }}
                className="hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2"
              >
                <ArrowLeft className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                <span className="hidden sm:inline">
                  {t.backToMarketplace || "Back to Marketplace"}
                </span>
              </Button>

              <div className="hidden sm:block w-px h-8 bg-gray-200" />

              <button
                onClick={onBack}
                className="flex items-center hover:opacity-80 transition-opacity"
                title="Return to Home"
              >
                <Logo darkMode={darkMode} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="bg-white dark:bg-[#262626] border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500`}
              />
              <Input
                placeholder={
                  language === "ar"
                    ? "البحث في جميع المنشورات..."
                    : "Search all posts..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? "pr-12 pl-4" : "pl-12 pr-4"} h-12 rounded-xl border-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 transform -translate-y-1/2`}
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                  style={{ borderColor: "#0A4ABF", color: "#0A4ABF" }}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {t.filters || "Filters"}
                </Button>

                {/* Desktop Filters */}
                <div className="hidden lg:flex items-center gap-3 flex-wrap">
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={t.priceRange || "Price Range"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t.allPrices || "All Prices"}
                      </SelectItem>
                      <SelectItem value="0-50">0 - 50 JOD</SelectItem>
                      <SelectItem value="50-100">50 - 100 JOD</SelectItem>
                      <SelectItem value="100-500">100 - 500 JOD</SelectItem>
                      <SelectItem value="500+">500+ JOD</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t.sortBy || "Sort By"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">
                        {t.mostRecent || "Most Recent"}
                      </SelectItem>
                      <SelectItem value="price-low">
                        {t.priceLowToHigh || "Price: Low to High"}
                      </SelectItem>
                      <SelectItem value="price-high">
                        {t.priceHighToLow || "Price: High to Low"}
                      </SelectItem>
                      <SelectItem value="name">
                        {t.nameAZ || "Name: A-Z"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Mode Controls - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid-4")}
                    className={`h-8 w-8 p-0 ${viewMode === "grid-4" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    style={{
                      color: viewMode === "grid-4" ? "#0A4ABF" : "#6B7280",
                    }}
                    title="4 columns"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid-3")}
                    className={`h-8 w-8 p-0 ${viewMode === "grid-3" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    style={{
                      color: viewMode === "grid-3" ? "#0A4ABF" : "#6B7280",
                    }}
                    title="3 columns"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid-2")}
                    className={`h-8 w-8 p-0 ${viewMode === "grid-2" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    style={{
                      color: viewMode === "grid-2" ? "#0A4ABF" : "#6B7280",
                    }}
                    title="2 columns"
                  >
                    <Columns className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    style={{
                      color: viewMode === "list" ? "#0A4ABF" : "#6B7280",
                    }}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="lg:hidden overflow-hidden"
                >
                  <div
                    className="flex flex-col gap-3 pt-3 border-t dark:border-gray-700"
                    style={{ borderColor: "#F5F6FA" }}
                  >
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t.priceRange || "Price Range"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t.allPrices || "All Prices"}
                        </SelectItem>
                        <SelectItem value="0-50">0 - 50 JOD</SelectItem>
                        <SelectItem value="50-100">50 - 100 JOD</SelectItem>
                        <SelectItem value="100-500">100 - 500 JOD</SelectItem>
                        <SelectItem value="500+">500+ JOD</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.sortBy || "Sort By"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">
                          {t.mostRecent || "Most Recent"}
                        </SelectItem>
                        <SelectItem value="price-low">
                          {t.priceLowToHigh || "Price: Low to High"}
                        </SelectItem>
                        <SelectItem value="price-high">
                          {t.priceHighToLow || "Price: High to Low"}
                        </SelectItem>
                        <SelectItem value="name">
                          {t.nameAZ || "Name: A-Z"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters */}
            {(priceRange !== "all" || searchQuery) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.activeFilters || "Active filters"}:
                </span>
                {searchQuery && (
                  <Badge
                    variant="outline"
                    className="gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setSearchQuery("")}
                  >
                    {searchQuery}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                {priceRange !== "all" && (
                  <Badge
                    variant="outline"
                    className="gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setPriceRange("all")}
                  >
                    {priceRange} JOD
                    <X className="w-3 h-3" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  style={{ color: "#0A4ABF" }}
                  onClick={() => {
                    setSearchQuery("");
                    setPriceRange("all");
                  }}
                >
                  {t.clearAll || "Clear all"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isSearching && (
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {language === "ar" ? "جاري تحميل النتائج..." : "Loading results..."}
          </div>
        )}
        {searchError && !isSearching && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {searchError}
          </div>
        )}
        {filteredProducts.length > 0 ? (
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
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                viewMode={viewMode}
                isFavorite={favoriteIds.includes(product.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserDisplayName={currentUserDisplayName}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-800">
              <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-3 text-black dark:text-white">
              {language === "ar"
                ? "لم يتم العثور على منشورات"
                : "No Posts Found"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {language === "ar"
                ? "حاول تعديل الفلاتر أو مصطلحات البحث للعثور على ما تبحث عنه."
                : "Try adjusting your filters or search terms to find what you're looking for."}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setPriceRange("all");
              }}
              style={{ backgroundColor: "#0A4ABF", color: "white" }}
            >
              {t.clearFilters || "Clear Filters"}
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}

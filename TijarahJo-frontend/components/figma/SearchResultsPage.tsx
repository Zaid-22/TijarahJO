import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ProductCard } from "./ProductCard";
import { Badge } from "../ui/badge";
import { Logo } from "../ui/logo";
import { Footer } from "./Footer";
import { translations, Language } from "../../translations";
import { Product } from "../../types";
import { useState } from "react";
import { 
  ArrowLeft,
  Search,
  Filter,
  Grid3x3,
  LayoutGrid,
  List,
  Columns
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
  isAuthenticated = false
}: SearchResultsPageProps) {
  const [viewMode, setViewMode] = useState<"grid-4" | "grid-3" | "grid-2" | "list">("grid-4");
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);

  const t = translations[language];
  const isRTL = language === "ar";

  // Filter products by search query only
  const query = localSearchQuery.toLowerCase().trim();
  let filteredProducts = products.filter(p => 
    (p.status !== "SOLD" && p.status !== "DELETED") && // Filter out SOLD/DELETED
    (p.name.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    p.location.toLowerCase().includes(query) ||
    p.seller.toLowerCase().includes(query))
  );

  const handleNewSearch = () => {
    onSearch(localSearchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-md" style={{ backgroundColor: "rgba(10, 74, 191, 0.95)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <Input 
                  placeholder={t.searchPlaceholder}
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                      handleNewSearch();
                    }
                  }}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white border-none`}
                />
                {localSearchQuery && (
                  <button
                    onClick={() => {
                      setLocalSearchQuery("");
                      onSearch("");
                    }}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Info */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-black dark:text-white">
            {language === "ar" ? `نتائج البحث عن "${localSearchQuery}"` : `Search results for "${localSearchQuery}"`}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Controls - Hidden on mobile, shown on larger screens */}
        <div className="hidden sm:flex items-center justify-end mb-8">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
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

        {/* Product Grid */}
        <div className={`grid ${
          viewMode === "grid-4" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : viewMode === "grid-3" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
            : viewMode === "grid-2" 
            ? "grid-cols-1 sm:grid-cols-2" 
            : "grid-cols-1"
        } gap-4 sm:gap-5 md:gap-6 transition-all duration-300`}>
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-black dark:text-white mb-2">
                {language === "ar" ? "لا توجد نتائج" : "No results found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {language === "ar" ? `لم نكن من العثور على أي منتجات تطابق "${localSearchQuery}"` : `We couldn't find any products matching "${localSearchQuery}"`}
              </p>
              <Button
                onClick={() => {
                  setLocalSearchQuery("");
                  onSearch("");
                  onBack();
                }}
                className="mt-4"
                style={{ backgroundColor: "#0A4ABF", color: "white" }}
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
                isFavorite={favoriteIds.includes(product.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ProductCard } from "./ProductCard";
import { Input } from "../ui/input";
import { Footer } from "./Footer";
import { translations, Language } from "../../translations";
import { Product } from "../../types";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { 
  ArrowLeft, 
  Search, 
  Grid3x3, 
  LayoutGrid, 
  List, 
  Columns,
  Loader2,
  Heart,
  User,
  Plus,
  Languages as LanguagesIcon,
  ChevronLeft,
  ChevronRight,
  Smartphone
} from "lucide-react";
import { useState, useMemo } from "react";

interface MobilePhonesTabletsPageProps {
  onBack: () => void;
  products: Product[];
  onProductClick: (productId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (productId: string) => void;
  language: Language;
  onShowFavorites?: () => void;
  onShowSellItem?: () => void;
  onShowProfile?: () => void;
  onShowSettings?: () => void;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
  onCategoryClick?: (categoryName: string) => void;
  isAuthenticated?: boolean;
  currentUserName?: string;
  userAvatar?: string;
  userFirstName?: string;
  userLastName?: string;
}

export function MobilePhonesTabletsPage({ 
  onBack, 
  products, 
  onProductClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  onShowFavorites,
  onShowSellItem,
  onShowProfile,
  onShowSettings,
  onLogout,
  onToggleLanguage,
  onCategoryClick,
  isAuthenticated = false,
  currentUserName,
  userAvatar,
  userFirstName,
  userLastName
}: MobilePhonesTabletsPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid-4" | "grid-3" | "grid-2" | "list">("grid-4");

  const filteredProducts = useMemo(() => {
    const categoryProducts = products.filter(p => p.category === "Mobile Phones & Tablets" && p.status !== "SOLD" && p.status !== "DELETED");
    if (!activeSearchQuery.trim()) return categoryProducts;
    
    const query = activeSearchQuery.toLowerCase().trim();
    return categoryProducts.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(query);
      const locationMatch = p.location.toLowerCase().includes(query);
      const sellerMatch = p.seller.toLowerCase().includes(query);
      return nameMatch || locationMatch || sellerMatch;
    });
  }, [products, activeSearchQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      setActiveSearchQuery(searchQuery.trim());
    }
  };

  const { 
    displayedItems, 
    isLoading, 
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage
  } = useInfiniteScroll({
    items: filteredProducts,
    itemsPerPage: 12
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-0"
                style={{ color: "#0A4ABF" }}
              >
                <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Logo size="md" />
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500`} />
                <Input 
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`${isRTL ? 'pr-12' : 'pl-12'} h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-[#0A4ABF] dark:focus:border-[#3E7EFF] rounded-full dark:text-white dark:placeholder:text-gray-500`}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveSearchQuery("");
                    }}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                className="hover:opacity-90 shadow-sm dark:shadow-[#0A4ABF]/20"
                style={{ backgroundColor: "#0A4ABF", color: "white" }}
                onClick={onShowSellItem}
              >
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="hidden sm:inline">{t.sellItem}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-[#3E7EFF]"
                style={{ color: "#0A4ABF" }}
                onClick={onShowFavorites}
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-[#3E7EFF]"
                style={{ color: "#0A4ABF" }}
                onClick={onShowProfile}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-[#3E7EFF]"
                style={{ color: "#0A4ABF" }}
                onClick={onToggleLanguage}
              >
                <LanguagesIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500`} />
              <Input 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`${isRTL ? 'pr-12' : 'pl-12'} h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-[#0A4ABF] dark:focus:border-[#3E7EFF] rounded-full dark:text-white dark:placeholder:text-gray-500`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category Header */}
      <section className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <Smartphone className="w-8 h-8" style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <h1 className="text-2xl text-gray-900 dark:text-white">
                Mobile Phones & Tablets
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse all mobile phones and tablets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="hidden sm:flex items-center justify-end mb-6">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-4")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-4" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-3")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-3" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid-2")}
              className={`h-9 w-9 p-0 ${viewMode === "grid-2" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
            >
              <Columns className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 p-0 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className={`grid ${viewMode === "grid-4" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : viewMode === "grid-3" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : viewMode === "grid-2" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-6`}>
          {displayedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-black dark:text-white mb-2">
                {language === "ar" ? "لا توجد نتائج" : "No results found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {activeSearchQuery 
                  ? (language === "ar" ? `لم نتمكن من العثور على "${activeSearchQuery}"` : `No posts matching "${activeSearchQuery}"`)
                  : (language === "ar" ? "لا توجد منشورات" : "No posts available")
                }
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
                currentUserName={currentUserName}
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
                className="px-6 py-3 rounded-xl disabled:opacity-50"
                style={{
                  backgroundColor: currentPage === 1 ? "#E5E7EB" : "#0A4ABF",
                  color: currentPage === 1 ? "#9CA3AF" : "white",
                }}
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
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
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
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
                className="px-6 py-3 rounded-xl disabled:opacity-50 transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#0A4ABF",
                  color: "white",
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{language === "ar" ? "التالي" : "Next"}</span>
                  <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </Button>
            </div>

            <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              {language === "ar" 
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`
              }
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0A4ABF" }} />
          </div>
        )}
      </main>
      <Footer language={language} />
    </div>
  );
}
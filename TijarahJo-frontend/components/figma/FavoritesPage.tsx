import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ProductCard } from "./ProductCard";
import { Footer } from "./Footer";
import { translations, Language } from "../../translations";
import { Product } from "../../types";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";

interface FavoritesPageProps {
  onBackToMarketplace: () => void;
  favoriteIds: string[];
  products: Product[];
  onRemoveFavorite: (productId: string) => void;
  onProductClick: (productId: string) => void;
  language: Language;
}

export function FavoritesPage({
  onBackToMarketplace,
  favoriteIds,
  products,
  onRemoveFavorite,
  onProductClick,
  language,
}: FavoritesPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";

  const favoriteProducts = products.filter((p) =>
    favoriteIds.includes(p.id),
  );

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a]"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111111] shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={onBackToMarketplace}
                style={{ color: "#0A4ABF" }}
                className="hover:bg-blue-50 -ml-2"
              >
                <ArrowLeft
                  className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`}
                />
                <span className="hidden sm:inline">
                  {t.backToListings || "Back to Listings"}
                </span>
              </Button>

              <div className="hidden sm:block w-px h-8 bg-gray-200" />

              <button
                onClick={onBackToMarketplace}
                className="cursor-pointer hidden sm:block"
                title="Return to Home"
              >
                <Logo />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #0A4ABF 0%, #3E7EFF 100%)",
              }}
            >
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 style={{ color: "#000000" }}>
                {t.favorites || "My Favorites"}
              </h1>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={() =>
                  onProductClick(product.id)
                } // Placeholder, as we don't have a product click handler here
                viewMode="grid-4"
                isFavorite={true}
                onFavoriteToggle={onRemoveFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E5EDFF" }}
            >
              <Heart
                className="w-12 h-12"
                style={{ color: "#0A4ABF" }}
              />
            </div>
            <h2 className="mb-3" style={{ color: "#000000" }}>
              {t.noFavorites || "No Favorites Yet"}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              {t.noFavoritesDescription ||
                "Start adding items to your favorites to see them here. Click the heart icon on any product to save it."}
            </p>
            <Button
              onClick={onBackToMarketplace}
              style={{
                backgroundColor: "#0A4ABF",
                color: "white",
              }}
            >
              <ShoppingBag
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
              />
              {t.browseListing || "Browse Listings"}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}
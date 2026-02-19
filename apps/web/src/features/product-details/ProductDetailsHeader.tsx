import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Logo } from "../../shared/ui/logo";
import type { Language, Product } from "../../types";
import { shareProduct } from "../../utils/shareUtils";

interface ProductDetailsHeaderProps {
  product: Product;
  language: Language;
  isRTL: boolean;
  isAuthenticated: boolean;
  isOwnProduct?: boolean;
  isFavorited: boolean;
  onBack: () => void;
  onFavoriteToggle?: (productId: string) => void;
  backToListingsLabel: string;
}

export function ProductDetailsHeader({
  product,
  language,
  isRTL,
  isAuthenticated,
  isOwnProduct,
  isFavorited,
  onBack,
  onFavoriteToggle,
  backToListingsLabel,
}: ProductDetailsHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-[#111111] shadow-sm border-b dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            <Button
              variant="ghost"
              onClick={onBack}
              style={{ color: "#0A4ABF" }}
              className="hover:bg-blue-50 transition-all duration-200 hover:scale-105 -ml-2 rounded-xl h-9 sm:h-10 px-2 sm:px-4"
            >
              <ArrowLeft
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isRTL ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"
                }`}
              />
              <span className="text-sm sm:text-base font-semibold">
                {backToListingsLabel}
              </span>
            </Button>

            <div className="hidden sm:block w-px h-10 bg-gray-200" />

            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 hidden sm:flex items-center px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
              title="Return to Home"
            >
              <Logo size="md" />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 hover:shadow-sm rounded-lg h-9 w-9 sm:h-10 sm:w-10 p-0"
              title={language === "ar" ? "مشاركة" : "Share"}
              aria-label={
                language === "ar" ? "مشاركة هذا المنتج" : "Share this product"
              }
              onClick={() => shareProduct(product, language)}
            >
              <Share2
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: "#0A4ABF" }}
              />
            </Button>

            {isAuthenticated && !isOwnProduct && (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 hover:shadow-sm rounded-lg h-9 w-9 sm:h-10 sm:w-10 p-0"
                onClick={() => onFavoriteToggle?.(product.id)}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                    isFavorited ? "fill-current scale-110" : ""
                  }`}
                  style={{ color: "#EF4444" }}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

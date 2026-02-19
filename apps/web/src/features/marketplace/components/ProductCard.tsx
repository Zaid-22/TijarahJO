import { CardContent } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { Heart, MapPin, User, Eye } from "lucide-react";
// import { useState } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Product } from "../../../types";
import { deferredToast } from "../../../utils/toast";

interface ProductCardProps {
  product: Product;
  onProductClick?: (productId: string) => void;
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
  isFavorite?: boolean;
  onFavoriteToggle?: (productId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string; // Fallback owner check when sellerId is unavailable
  currentUserId?: string;
  hideCategoryBadge?: boolean; // Hide category badge when on category page
}

export function ProductCard({
  product,
  onProductClick,
  viewMode = "grid-4",
  isFavorite = false,
  onFavoriteToggle,
  isAuthenticated = false,
  currentUserDisplayName,
  currentUserId,
  hideCategoryBadge,
}: ProductCardProps) {
  // const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      deferredToast.error("Please log in to add items to favorites", {
        description: "You need to be logged in to save your favorite items",
        duration: 3000,
      });
      return;
    }
    onFavoriteToggle?.(product.id);
  };

  // Determine ownership primarily by user ID, with display-name fallback for legacy data.
  const normalizedCurrentUserId = String(currentUserId || "").trim();
  const normalizedSellerId = String(product.sellerId || "").trim();
  const normalizedCurrentUserDisplayName = String(currentUserDisplayName || "")
    .trim()
    .toLowerCase();
  const normalizedSellerName = String(product.seller || "").trim().toLowerCase();
  const isOwnerById =
    normalizedCurrentUserId.length > 0 &&
    normalizedSellerId.length > 0 &&
    normalizedCurrentUserId === normalizedSellerId;
  const isOwnerByDisplayName =
    normalizedCurrentUserDisplayName.length > 0 &&
    normalizedCurrentUserDisplayName === normalizedSellerName;
  const isOwner = isOwnerById || isOwnerByDisplayName;
  // Only show favorite button if authenticated AND not the owner
  const showFavoriteButton = isAuthenticated && !isOwner;

  const isListView = viewMode === "list";

  if (isListView) {
    // List View Layout
    return (
      <div
        className="group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_12px_28px_rgba(10,74,191,0.15)] dark:hover:shadow-primary/20 animate-fade-in flex flex-col sm:flex-row backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        onClick={() => onProductClick?.(product.id)}
      >
        {/* Product Image - Smaller in list view */}
        <div className="relative w-full sm:w-64 aspect-square overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            // onLoad={() => setIsImageLoaded(true)}
            style={{ objectFit: "cover" }}
          />

          {/* Category Badge */}
          {!hideCategoryBadge && (
            <div className="absolute top-3 left-3 z-[5]">
              <Badge className="backdrop-blur-md px-3 py-1 shadow-sm bg-white/95 text-primary border-none">
                {product.category}
              </Badge>
            </div>
          )}

          {/* SOLD Badge */}
          {product.status === "SOLD" && (
            <div
              className={`absolute ${!hideCategoryBadge && isAuthenticated ? "top-[4rem]" : "top-3"} right-3 z-10`}
            >
              <Badge
                className="backdrop-blur-md px-3 py-1 shadow-sm"
                style={{
                  backgroundColor: "rgba(156, 163, 175, 0.95)",
                  color: "white",
                  border: "none",
                  fontWeight: "600",
                }}
              >
                SOLD OUT
              </Badge>
            </div>
          )}
        </div>

        {/* Content - Expanded in list view */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="mb-2 text-black dark:text-white group-hover:text-[#0A4ABF] dark:group-hover:text-[#3E7EFF] transition-colors">
                  {product.name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-primary">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {product.location}
                      {product.area ? `, ${product.area}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-primary">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span>{product.seller}</span>
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              {showFavoriteButton && (
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{
                    backgroundColor: "transparent",
                  }}
                >
                  <Heart
                    className="w-5 h-5 transition-all duration-200"
                    style={{
                      color: "#EF4444",
                      fill: isFavorite ? "#EF4444" : "none",
                      strokeWidth: 2,
                    }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Price and Action */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                {product.price.toLocaleString()}
              </span>
              <span className="text-lg text-gray-600 dark:text-gray-400 ml-2">
                JOD
              </span>
            </div>
            <Button
              size="lg"
              className="hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg px-8 bg-primary text-white"
              onClick={(e) => {
                e.stopPropagation();
                onProductClick?.(product.id);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout (default)
  return (
    <div
      className="group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_12px_28px_rgba(10,74,191,0.15)] dark:hover:shadow-primary/20 hover:-translate-y-1 animate-fade-in backdrop-blur-sm flex flex-col h-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transform"
      onClick={() => onProductClick?.(product.id)}
    >
      {/* Product Image - Fixed aspect ratio 4:3 for better balance */}
      <div
        className="relative w-full overflow-hidden flex-shrink-0"
        style={{ aspectRatio: "4/3" }}
      >
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          // onLoad={() => setIsImageLoaded(true)}
          style={{ objectFit: "cover" }}
        />

        {/* Favorite Button */}
        {showFavoriteButton && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md hover:bg-gray-100/80 dark:hover:bg-gray-800/80 z-10"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <Heart
              className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"
              style={{
                color: "#EF4444",
                fill: isFavorite ? "#EF4444" : "none",
                strokeWidth: 2,
              }}
            />
          </button>
        )}

        {/* Category Badge - Proper padding from edges */}
        {!hideCategoryBadge && (
          <div className="absolute top-3 left-3 z-[5]">
            <Badge className="backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm shadow-sm bg-white/95 text-primary border-none">
              <span className="line-clamp-1">{product.category}</span>
            </Badge>
          </div>
        )}

        {/* SOLD Badge - Adjusted positioning for better spacing */}
        {product.status === "SOLD" && (
          <div
            className={`absolute ${!hideCategoryBadge && isAuthenticated ? "top-[3.5rem]" : "top-3"} right-3 z-10`}
          >
            <Badge
              className="backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm shadow-sm"
              style={{
                backgroundColor: "rgba(156, 163, 175, 0.95)",
                color: "white",
                border: "none",
                fontWeight: "600",
              }}
            >
              SOLD OUT
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
        <div className="mb-3 sm:mb-4 flex-grow">
          <h3 className="line-clamp-2 mb-2 sm:mb-3 text-base sm:text-lg text-black dark:text-white group-hover:text-[#0A4ABF] dark:group-hover:text-[#3E7EFF] transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
            {product.name}
          </h3>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <MapPin
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                  style={{ color: "#0A4ABF" }}
                />
              </div>
              <span className="truncate">
                {product.location}
                {product.area ? `, ${product.area}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <User
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                  style={{ color: "#0A4ABF" }}
                />
              </div>
              <span className="truncate">{product.seller}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex-1 min-w-0 mr-2">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                {product.price.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                JOD
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg px-3 sm:px-4 md:px-6 text-xs sm:text-sm flex-shrink-0 bg-primary text-white"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick?.(product.id);
            }}
          >
            <span className="hidden sm:inline">View</span>
            <Eye className="w-4 h-4 sm:hidden" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}

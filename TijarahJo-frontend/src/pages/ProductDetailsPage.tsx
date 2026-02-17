import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Product, Language } from "../types";
import { translations } from "../translations";
import { EditProductDialog } from "../components/figma/EditProductDialog";
import { Logo } from "../components/ui/logo";
import { api } from "../services/api";
import { shareProduct } from "../utils/shareUtils";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { normalizeSellerDisplayName } from "../utils/sellerDisplayName";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  Trash2,
  ArrowLeft,
  Edit,
} from "lucide-react";

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  allProducts?: Product[]; // Add this to calculate seller's active listings
  language: Language;
  onProductClick?: (productId: string) => void;
  onSellerClick?: () => void;
  onUpdateProduct?: (product: Product) => void | Promise<void>;
  onDeleteProduct?: (productId: string) => void | Promise<void>;
  isOwnProduct?: boolean;
  onChatWithSeller?: () => void;
  favoriteIds?: string[];
  onFavoriteToggle?: (productId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string;
}

export function ProductDetailsPage({
  product,
  onBack,
  allProducts,
  language,
  onSellerClick,
  onUpdateProduct,
  onDeleteProduct,
  isOwnProduct,
  onChatWithSeller,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
}: ProductDetailsPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarkAsSoldDialog, setShowMarkAsSoldDialog] = useState(false);
  const [showRelistDialog, setShowRelistDialog] = useState(false);
  const [sellerJoinDate, setSellerJoinDate] = useState<string | null>(null);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [sellerCity, setSellerCity] = useState<string | null>(null);
  const [sellerArea, setSellerArea] = useState<string | null>(null);
  const [displayedViews, setDisplayedViews] = useState<number>(product.views ?? 0);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  const t = translations[language];
  const isRTL = language === "ar";

  // Scroll to top when product details page loads or product changes
  useEffect(() => {
    setSelectedImage(0);
    setDisplayedViews(product.views ?? 0);
    // Scroll to top immediately and forcefully when product changes
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Backup: Also try scrolling the document element
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [product.id, product.views]);

  // Keep relative time label fresh while user stays on this page.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // Track view when product details page is viewed
  useEffect(() => {
    let cancelled = false;

    if (product.id) {
      // Increment view count (fire and forget - don't block UI)
      api.posts.trackView(product.id).then((tracked) => {
        if (tracked && !cancelled) {
          setDisplayedViews((prev) => prev + 1);
        }
      }).catch(() => {
        // Fire-and-forget analytics should not block UI.
      });
    }

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  // Fetch seller data to get join date, avatar, and phone
  useEffect(() => {
    let cancelled = false;

    const fetchSellerData = async () => {
      setSellerJoinDate(null);
      setSellerAvatar(null);
      setSellerPhone(null);
      setSellerName(null);
      setSellerCity(null);
      setSellerArea(null);

      if (product.sellerId) {
        try {
          const user = await api.users.getUser(String(product.sellerId));
          if (cancelled || !user) {
            return;
          }

          const joinDate =
            user?.JoinedDate || user?.joinedDate || user?.JoinDate;
          const avatar = user?.avatar;
          const phone = user?.phone;
          let city = user?.city || null;
          let area = user?.area || null;
          const firstName = user?.FirstName || user?.firstName || "";
          const lastName = user?.LastName || user?.lastName || "";
          const fullName = user?.name || `${firstName} ${lastName}`.trim();
          const email = user?.Email || user?.email || "";

          if (fullName || email) {
            setSellerName(
              normalizeSellerDisplayName(fullName || email, String(product.sellerId)),
            );
          }
          if (joinDate) {
            setSellerJoinDate(joinDate);
          }
          if (avatar) {
            setSellerAvatar(avatar);
          }
          if (phone) {
            setSellerPhone(phone);
          }
          if (!city && !area) {
            try {
              const sellerProfileResponse = await api.sellers.getSellerProfile(
                String(product.sellerId),
              );
              const sellerProfile = sellerProfileResponse?.seller;
              city = sellerProfile?.city || city;
              area = sellerProfile?.area || area;
            } catch {
              // Keep existing location fallback behavior if seller profile fetch fails.
            }
          }

          if (city) {
            setSellerCity(String(city));
          }
          if (area) {
            setSellerArea(String(area));
          }
        } catch (error) {
          console.warn(
            "[ProductDetailsPage] Failed to fetch seller data:",
            error,
          );
        }
      }
    };
    fetchSellerData();

    return () => {
      cancelled = true;
    };
  }, [product.sellerId]);

  // Get product images with fallback
  const productImages =
    product.images && product.images.length > 0
      ? product.images.filter((img) => img && img.trim() !== "")
      : product.image && product.image.trim() !== ""
        ? [product.image]
        : [];

  // Ensure we always have at least one image (fallback placeholder)
  // Use empty string - ImageWithFallback will handle the placeholder
  const displayImages = productImages.length > 0 ? productImages : [""]; // Empty string triggers ImageWithFallback placeholder

  // Check if there are actually multiple unique images
  const hasMultipleImages = displayImages.length > 1;

  // Guard against stale index when the image array changes.
  useEffect(() => {
    if (selectedImage >= displayImages.length) {
      setSelectedImage(0);
    }
  }, [selectedImage, displayImages.length]);

  const nextImage = () => {
    if (hasMultipleImages) {
      setSelectedImage((prev) => (prev + 1) % displayImages.length);
    }
  };

  const prevImage = () => {
    if (hasMultipleImages) {
      setSelectedImage(
        (prev) => (prev - 1 + displayImages.length) % displayImages.length,
      );
    }
  };

  const isFavorited = favoriteIds.includes(product.id);
  const publicSellerName = normalizeSellerDisplayName(
    sellerName || product.seller,
    String(product.sellerId || ""),
  );

  const displayLocationLabel = useMemo(() => {
    const normalizeLocationValue = (value: unknown): string => {
      if (typeof value !== "string") {
        return "";
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return "";
      }
      const lowered = trimmed.toLowerCase();
      if (lowered === "null" || lowered === "undefined" || lowered === "n/a") {
        return "";
      }
      return trimmed;
    };

    const jordanLabels = [t.jordan, "Jordan", "الأردن"].map((value) =>
      value.toLowerCase(),
    );
    const isJordanLabel = (value: string): boolean =>
      jordanLabels.includes(value.toLowerCase());
    const postArea = normalizeLocationValue(product.area);
    const sellerAreaValue = normalizeLocationValue(sellerArea);
    const resolvedArea = postArea || sellerAreaValue;

    const postCityRaw = normalizeLocationValue(product.location);
    const sellerCityValue = normalizeLocationValue(sellerCity);
    const resolvedCity =
      postCityRaw && !isJordanLabel(postCityRaw)
        ? postCityRaw
        : sellerCityValue || postCityRaw;

    const parts: string[] = [];
    if (resolvedArea && !isJordanLabel(resolvedArea)) {
      parts.push(resolvedArea);
    }

    if (
      resolvedCity &&
      !isJordanLabel(resolvedCity) &&
      !parts.some((part) => part.toLowerCase() === resolvedCity.toLowerCase())
    ) {
      parts.push(resolvedCity);
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }

    if (resolvedCity) {
      return resolvedCity;
    }

    return t.jordan;
  }, [product.area, product.location, sellerArea, sellerCity, t.jordan]);

  // Calculate seller's active listings
  const normalizedCurrentSellerId = String(product.sellerId || "").trim();
  const normalizedCurrentSellerName = String(product.seller || "")
    .trim()
    .toLowerCase();
  const activeListingsCount = allProducts
    ? allProducts.filter((p) => {
        if (p.status !== "ACTIVE") {
          return false;
        }

        const candidateSellerId = String(p.sellerId || "").trim();
        if (normalizedCurrentSellerId && candidateSellerId) {
          return candidateSellerId === normalizedCurrentSellerId;
        }

        return (
          String(p.seller || "")
            .trim()
            .toLowerCase() === normalizedCurrentSellerName
        );
      }).length
    : 0;

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Header */}
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
                  {t.backToListings}
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
                  title={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Heart
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                      isFavorited ? "fill-current scale-110" : ""
                    }`}
                    style={{
                      color: "#EF4444",
                    }}
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden dark:bg-gray-800/80 dark:border-gray-700">
              <div className="relative w-full bg-gray-100 dark:bg-gray-900">
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[300px] sm:min-h-[400px] overflow-hidden">
                  {/* Preload adjacent images for smoother transitions */}
                  {hasMultipleImages &&
                    displayImages.map((img, idx) => {
                      const isAdjacent =
                        idx === (selectedImage + 1) % displayImages.length ||
                        idx ===
                          (selectedImage - 1 + displayImages.length) %
                            displayImages.length;
                      return isAdjacent && img ? (
                        <img
                          key={`preload-${idx}`}
                          src={img}
                          alt=""
                          className="hidden"
                          loading="eager"
                          onLoad={() => {}} // Prevents console warnings
                        />
                      ) : null;
                    })}
                  <ImageWithFallback
                    key={`img-${selectedImage}`}
                    src={displayImages[selectedImage] || ""}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                    onClick={() => setImageDialogOpen(true)}
                    fallbackSrc="https://via.placeholder.com/800x600?text=No+Image+Available"
                  />

                  {/* Image Navigation Arrows - Stay inside image, vertically centered */}
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full shadow-xl transition-all hover:scale-110 border-2 border-white/20"
                        onClick={prevImage}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full shadow-xl transition-all hover:scale-110 border-2 border-white/20"
                        onClick={nextImage}
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Image Indicators - Outside image, below container */}
              {hasMultipleImages && (
                <div className="flex gap-2 justify-center py-3 bg-white dark:bg-gray-800/80">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className="rounded-full transition-all hover:scale-125 active:scale-110 p-2"
                      aria-label={`Go to image ${index + 1}`}
                    >
                      <span
                        className="block rounded-full transition-all"
                        style={{
                          width: index === selectedImage ? "32px" : "12px",
                          height: "12px",
                          backgroundColor:
                            index === selectedImage ? "#0A4ABF" : "#D1D5DB",
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Thumbnail Gallery */}
              {hasMultipleImages && (
                <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto border-t dark:border-gray-700">
                  {displayImages.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedImage(index);
                        setImageDialogOpen(true);
                      }}
                      className="w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        borderColor:
                          index === selectedImage ? "#0A4ABF" : "transparent",
                      }}
                      aria-label={`View image ${index + 1}`}
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                        fallbackSrc="https://via.placeholder.com/200x200?text=No+Image"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Product Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge
                        className="backdrop-blur-md px-3 py-1 font-semibold text-sm"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          color: "#0A4ABF",
                          border: "none",
                        }}
                      >
                        {product.category}
                      </Badge>

                      {/* SOLD Badge */}
                      {product.status === "SOLD" && (
                        <Badge
                          className="backdrop-blur-md px-3 py-1"
                          style={{
                            backgroundColor: "rgba(156, 163, 175, 0.95)",
                            color: "white",
                            border: "none",
                            fontWeight: "600",
                          }}
                        >
                          {t.soldOut || "SOLD OUT"}
                        </Badge>
                      )}
                    </div>
                    <h1
                      className="mb-2 text-2xl sm:text-3xl font-bold"
                      style={{ color: "#000000" }}
                    >
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{displayLocationLabel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {(() => {
                            if (!product.createdAt) return t.postedDaysAgo;
                            const createdDate = new Date(product.createdAt);
                            const now = new Date(nowTimestamp);
                            const diffTime = Math.abs(
                              now.getTime() - createdDate.getTime(),
                            );
                            const diffDays = Math.floor(
                              diffTime / (1000 * 60 * 60 * 24),
                            );

                            if (diffDays === 0) {
                              const diffHours = Math.floor(
                                diffTime / (1000 * 60 * 60),
                              );
                              if (diffHours === 0) {
                                const diffMinutes = Math.floor(
                                  diffTime / (1000 * 60),
                                );
                                return language === "ar"
                                  ? `نُشر منذ ${diffMinutes} ${
                                      diffMinutes === 1 ? "دقيقة" : "دقائق"
                                    }`
                                  : `Posted ${diffMinutes} ${
                                      diffMinutes === 1 ? "minute" : "minutes"
                                    } ago`;
                              }
                              return language === "ar"
                                ? `نُشر منذ ${diffHours} ${
                                    diffHours === 1 ? "ساعة" : "ساعات"
                                  }`
                                : `Posted ${diffHours} ${
                                    diffHours === 1 ? "hour" : "hours"
                                  } ago`;
                            } else if (diffDays === 1) {
                              return language === "ar"
                                ? "نُشر منذ يوم"
                                : "Posted 1 day ago";
                            } else if (diffDays < 7) {
                              return language === "ar"
                                ? `نُشر منذ ${diffDays} ${
                                    diffDays === 2 ? "يومين" : "أيام"
                                  }`
                                : `Posted ${diffDays} days ago`;
                            } else if (diffDays < 30) {
                              const weeks = Math.floor(diffDays / 7);
                              return language === "ar"
                                ? `نُشر منذ ${weeks} ${
                                    weeks === 1 ? "أسبوع" : "أسابيع"
                                  }`
                                : `Posted ${weeks} ${
                                    weeks === 1 ? "week" : "weeks"
                                  } ago`;
                            } else if (diffDays < 365) {
                              const months = Math.floor(diffDays / 30);
                              return language === "ar"
                                ? `نُشر منذ ${months} ${
                                    months === 1 ? "شهر" : "أشهر"
                                  }`
                                : `Posted ${months} ${
                                    months === 1 ? "month" : "months"
                                  } ago`;
                            } else {
                              const years = Math.floor(diffDays / 365);
                              return language === "ar"
                                ? `نُشر منذ ${years} ${
                                    years === 1 ? "سنة" : "سنوات"
                                  }`
                                : `Posted ${years} ${
                                    years === 1 ? "year" : "years"
                                  } ago`;
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span className="font-medium">
                          {displayedViews} {t.views}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${
                      isRTL
                        ? "text-left sm:text-left"
                        : "text-left sm:text-right"
                    }`}
                  >
                    <div>
                      <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {product.price.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-600 dark:text-gray-400 ml-2">
                        JOD
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                {product.description && (
                  <>
                    <div>
                      <h3
                        className="mb-3 text-lg font-bold"
                        style={{ color: "#000000" }}
                      >
                        {t.descriptionTitle}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-normal">
                        {product.description}
                      </p>
                    </div>

                    <Separator className="my-6" />
                  </>
                )}

                {/* Safety Tips */}
                {/* Removed safety tips section */}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Seller Info and Actions */}
          <div className="space-y-6">
            {/* Seller Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    {sellerAvatar && (
                      <AvatarImage src={sellerAvatar} alt={publicSellerName} />
                    )}
                    <AvatarFallback>{publicSellerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3
                    className="mb-1 text-lg font-bold"
                    style={{ color: "#000000" }}
                  >
                    {publicSellerName}
                  </h3>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {t.memberSinceShort}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(() => {
                        if (!sellerJoinDate) return "Jan 2024";
                        const joinDate = new Date(sellerJoinDate);
                        const now = new Date();
                        // If date is in the future, use current date instead
                        const dateToUse = joinDate > now ? now : joinDate;
                        return dateToUse.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {t.activeListingsShort}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {activeListingsCount}{" "}
                      {activeListingsCount === 1
                        ? language === "ar"
                          ? "منشور"
                          : "post"
                        : t.items}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Contact Buttons */}
                <div className="space-y-3">
                  {isOwnProduct && onUpdateProduct && onDeleteProduct ? (
                    <>
                      {/* Owner Actions */}
                      {product.status === "SOLD" ? (
                        <Button
                          className="w-full transition-transform duration-150 font-semibold text-base"
                          style={{
                            backgroundColor: "#F97316",
                            color: "white",
                          }}
                          type="button"
                          onClick={() => setShowRelistDialog(true)}
                        >
                          {t.relist || "Re-list Post"}
                        </Button>
                      ) : (
                        <Button
                          className="w-full transition-transform duration-150 font-semibold text-base"
                          style={{
                            backgroundColor: "#10B981",
                            color: "white",
                          }}
                          type="button"
                          onClick={() => setShowMarkAsSoldDialog(true)}
                        >
                          {t.markAsSold || "Mark as Sold"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full font-semibold text-base"
                        onClick={onSellerClick}
                      >
                        {t.viewMyProfile || "View My Profile"}
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Buyer Actions - Hide if SOLD */}
                      {product.status === "SOLD" ? (
                        <div className="p-4 bg-red-50 rounded-lg text-center">
                          <p className="text-red-600 font-semibold">
                            {t.soldOut || "This post has been sold"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Button
                            className="w-full transition-transform duration-150 font-semibold text-base"
                            style={{
                              backgroundColor: "#0A4ABF",
                              color: "white",
                            }}
                            type="button"
                            onClick={() => setShowPhoneDialog(true)}
                          >
                            <Phone
                              className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                            />
                            {t.callSeller || "Call Seller"}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full hover:opacity-90 font-semibold text-base"
                            style={{
                              backgroundColor: "#1D4ED8",
                              borderColor: "#1D4ED8",
                              color: "white",
                            }}
                            onClick={onChatWithSeller}
                          >
                            <MessageSquare
                              className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                            />
                            {language === "ar"
                              ? "الدردشة مع البائع"
                              : "Chat with Seller"}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="w-full font-semibold text-base"
                        onClick={onSellerClick}
                      >
                        {t.viewSellerProfile || "View Seller Profile"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardContent className="pt-6">
                <h3
                  className="mb-3 flex items-center gap-2 text-base font-bold"
                  style={{ color: "#000000" }}
                >
                  <MapPin className="w-5 h-5" style={{ color: "#0A4ABF" }} />
                  {t.locationTitle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {displayLocationLabel}
                </p>
              </CardContent>
            </Card>

            {/* Edit and Delete Buttons for Own Products */}
            {isOwnProduct && onUpdateProduct && onDeleteProduct && (
              <Card
                className="overflow-hidden border-2"
                style={{ borderColor: "#0A4ABF20" }}
              >
                <CardContent className="pt-6 space-y-3">
                  {/* Show SOLD badge if product is sold */}
                  {product.status === "SOLD" && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center mb-3">
                      <Badge
                        className="backdrop-blur-md px-4 py-2 text-base"
                        style={{
                          backgroundColor: "rgba(156, 163, 175, 0.95)",
                          color: "white",
                          border: "none",
                          fontWeight: "600",
                        }}
                      >
                        🏷️ {t.soldOut || "SOLD OUT"}
                      </Badge>
                    </div>
                  )}

                  {/* Edit button - disabled if SOLD */}
                  <Button
                    className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:opacity-90"
                    style={{
                      backgroundColor:
                        product.status === "SOLD" ? "#9CA3AF" : "#0A4ABF",
                      color: "white",
                    }}
                    onClick={() => setShowEditDialog(true)}
                    disabled={product.status === "SOLD"}
                  >
                    <Edit
                      className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} ${
                        product.status !== "SOLD" ? "group-hover:scale-110" : ""
                      } transition-transform`}
                    />
                    {t.editPost || "Edit Post"}
                  </Button>

                  {/* Delete button - always enabled */}
                  <Button
                    className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:opacity-90 font-semibold text-base"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "white",
                    }}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2
                      className={`w-4 h-4 ${
                        isRTL ? "ml-2" : "mr-2"
                      } group-hover:scale-110 transition-transform`}
                    />
                    {t.deletePost || "Delete Post"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <EditProductDialog
          product={product}
          onSave={(updatedProduct) => {
            if (onUpdateProduct) {
              onUpdateProduct(updatedProduct);
            }
            setShowEditDialog(false);
          }}
          onCancel={() => setShowEditDialog(false)}
          language={language}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "هل أنت متأكد؟" : "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج نهائياً."
                : "This action cannot be undone. This will permanently delete the product."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (onDeleteProduct) {
                  await onDeleteProduct(product.id);
                }
                setShowDeleteDialog(false);
              }}
              style={{ backgroundColor: "#EF4444", color: "white" }}
            >
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {language === "ar" ? "مشاركة المنتج" : "Share Product"}
          </DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "اختر طريقة مشاركة المنتج مع الآخرين"
              : "Choose a way to share the product with others"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="hover:bg-white transition-all duration-200 hover:scale-110 hover:shadow-sm rounded-lg h-9 w-9 sm:h-10 sm:w-10 p-0"
                title={language === "ar" ? "مشاركة" : "Share"}
                aria-label={
                  language === "ar" ? "مشاركة هذا المنتج" : "Share this product"
                }
                onClick={async () => {
                  const shareUrl = window.location.href;
                  const shareTitle = product.name;
                  const shareText = `${product.name} - ${product.price} JOD`;

                  try {
                    // Check if native share is available (mobile browsers)
                    if (
                      navigator.share &&
                      navigator.canShare?.({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl,
                      })
                    ) {
                      await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl,
                      });
                      // Successfully shared - no need for alert
                    } else {
                      // Desktop fallback - copy to clipboard
                      await navigator.clipboard.writeText(shareUrl);
                      // Use a non-blocking notification
                      const notification = document.createElement("div");
                      notification.textContent =
                        language === "ar" ? "✓ تم نسخ الرابط" : "✓ Link copied";
                      notification.style.cssText = `
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #0A4ABF;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        z-index: 9999;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        animation: slideUp 0.3s ease;
                      `;
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        notification.style.opacity = "0";
                        notification.style.transition = "opacity 0.3s";
                        setTimeout(() => notification.remove(), 300);
                      }, 2000);
                    }
                  } catch (error) {
                    // Only handle non-user-cancellation errors
                    if (error instanceof Error && error.name !== "AbortError") {
                      // Final fallback - manual copy prompt
                      const userSelection = prompt(
                        language === "ar"
                          ? "انسخ هذا الرابط:"
                          : "Copy this link:",
                        shareUrl,
                      );
                      void userSelection;
                    }
                  }
                }}
              >
                <Share2
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: "#0A4ABF" }}
                />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {language === "ar" ? "عرض الصورة" : "View Image"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "عرض الصورة بالحجم الكامل"
              : "View full-size image"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full max-w-4xl aspect-square bg-gray-100 dark:bg-gray-800">
              <ImageWithFallback
                src={displayImages[selectedImage] || ""}
                alt={product.name}
                className="w-full h-full object-contain"
                fallbackSrc="https://via.placeholder.com/800x800?text=No+Image+Available"
              />

              {/* Image Navigation */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{
                          backgroundColor:
                            index === selectedImage
                              ? "#0A4ABF"
                              : "rgba(255, 255, 255, 0.5)",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {language === "ar" ? "رقم الهاتف" : "Phone Number"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "انقر على الرقم للاتصال بالبائع"
              : "Click the number to call the seller"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-6 p-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(10, 74, 191, 0.1)" }}
            >
              <Phone className="w-8 h-8" style={{ color: "#0A4ABF" }} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold">
                {language === "ar" ? "رقم الهاتف" : "Phone Number"}
              </h3>
              <p className="text-sm text-gray-500">
                {language === "ar"
                  ? "انقر على الرقم للاتصال بالبائع"
                  : "Click the number to call the seller"}
              </p>
            </div>
            <a
              href={`tel:${sellerPhone || product.phone || "962700000000"}`}
              className="text-3xl font-semibold tracking-wide hover:opacity-80 transition-opacity"
              style={{ color: "#0A4ABF" }}
            >
              {sellerPhone || product.phone || "+962 7 0000 0000"}
            </a>
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <a
                href={`tel:${sellerPhone || product.phone || "962700000000"}`}
                className="flex-1"
              >
                <Button
                  className="w-full"
                  style={{
                    backgroundColor: "#0A4ABF",
                    color: "white",
                  }}
                >
                  <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "اتصل الآن" : "Call Now"}
                </Button>
              </a>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPhoneDialog(false)}
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Sold Confirmation Dialog */}
      <AlertDialog
        open={showMarkAsSoldDialog}
        onOpenChange={setShowMarkAsSoldDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "تأكيد البيع" : "Confirm Sale"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل تريد تأكيد بيع هذا المنتج؟ سيتم وضع علامة 'مُباع' على المنتج ولن يتمكن المشترون من رؤيته."
                : "Are you sure you want to mark this post as sold? The post will be marked as 'SOLD' and buyers won't be able to view it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onUpdateProduct) {
                  onUpdateProduct({ ...product, status: "SOLD" });
                }
                setShowMarkAsSoldDialog(false);
              }}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: "#0A4ABF", color: "white" }}
            >
              {language === "ar" ? "تأكيد البيع" : "Mark as Sold"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Relist Confirmation Dialog */}
      <AlertDialog open={showRelistDialog} onOpenChange={setShowRelistDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ar" ? "تأكيد إعادة الإدراج" : "Confirm Re-listing"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "هل تريد إعادة إدراج هذا المنتج؟ سيتم تنشيط المنتج مرة أخرى ويمكن للمشترين مشاهدته."
                : "Are you sure you want to re-list this post? The post will become active again and buyers will be able to view it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onUpdateProduct) {
                  onUpdateProduct({ ...product, status: "ACTIVE" });
                }
                setShowRelistDialog(false);
              }}
              className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: "#0A4ABF", color: "white" }}
            >
              {language === "ar" ? "إعادة الإداج" : "Re-list Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
    </div>
  );
}

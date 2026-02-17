import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Edit,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Logo } from "../components/ui/logo";
import { ProductActionDialogs } from "./productDetails/ProductActionDialogs";
import { ProductImageGallery } from "./productDetails/ProductImageGallery";
import {
  countActiveListings,
  formatMemberSince,
  formatPostedAgo,
  resolveDisplayLocationLabel,
} from "./productDetails/productDetailsUtils";
import { Product, Language } from "../types";
import { translations } from "../translations";
import { api } from "../services/api";
import { shareProduct } from "../utils/shareUtils";
import { normalizeSellerDisplayName } from "../utils/sellerDisplayName";

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  allProducts?: Product[];
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

  useEffect(() => {
    setDisplayedViews(product.views ?? 0);

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [product.id, product.views]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (product.id) {
      api.posts
        .trackView(product.id)
        .then((tracked) => {
          if (tracked && !cancelled) {
            setDisplayedViews((prev) => prev + 1);
          }
        })
        .catch(() => {
          // Fire-and-forget analytics should not block UI.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  useEffect(() => {
    let cancelled = false;

    const fetchSellerData = async () => {
      setSellerJoinDate(null);
      setSellerAvatar(null);
      setSellerPhone(null);
      setSellerName(null);
      setSellerCity(null);
      setSellerArea(null);

      if (!product.sellerId) {
        return;
      }

      try {
        const user = await api.users.getUser(String(product.sellerId));
        if (cancelled || !user) {
          return;
        }

        const joinDate = user?.JoinedDate || user?.joinedDate || user?.JoinDate;
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
            normalizeSellerDisplayName(
              fullName || email,
              String(product.sellerId),
            ),
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
        console.warn("[ProductDetailsPage] Failed to fetch seller data:", error);
      }
    };

    void fetchSellerData();

    return () => {
      cancelled = true;
    };
  }, [product.sellerId]);

  const isFavorited = favoriteIds.includes(product.id);
  const publicSellerName = normalizeSellerDisplayName(
    sellerName || product.seller,
    String(product.sellerId || ""),
  );

  const displayLocationLabel = useMemo(
    () =>
      resolveDisplayLocationLabel({
        productArea: product.area,
        productLocation: product.location,
        sellerArea,
        sellerCity,
        jordanLabel: t.jordan,
      }),
    [product.area, product.location, sellerArea, sellerCity, t.jordan],
  );

  const activeListingsCount = useMemo(
    () => countActiveListings(allProducts, product),
    [allProducts, product],
  );

  const postedAgoLabel = useMemo(
    () => formatPostedAgo(product.createdAt, nowTimestamp, language, t.postedDaysAgo),
    [product.createdAt, nowTimestamp, language, t.postedDaysAgo],
  );

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ProductImageGallery product={product} language={language} />

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
                        <span className="font-medium">{postedAgoLabel}</span>
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
                      isRTL ? "text-left sm:text-left" : "text-left sm:text-right"
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    {sellerAvatar && <AvatarImage src={sellerAvatar} alt={publicSellerName} />}
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
                      {formatMemberSince(sellerJoinDate)}
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

                <div className="space-y-3">
                  {isOwnProduct && onUpdateProduct && onDeleteProduct ? (
                    <>
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
                            <Phone className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
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

            {isOwnProduct && onUpdateProduct && onDeleteProduct && (
              <Card
                className="overflow-hidden border-2"
                style={{ borderColor: "#0A4ABF20" }}
              >
                <CardContent className="pt-6 space-y-3">
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

                  <Button
                    className="w-full group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:opacity-90"
                    style={{
                      backgroundColor: product.status === "SOLD" ? "#9CA3AF" : "#0A4ABF",
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

      <ProductActionDialogs
        language={language}
        isRTL={isRTL}
        product={product}
        sellerPhone={sellerPhone}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        showPhoneDialog={showPhoneDialog}
        setShowPhoneDialog={setShowPhoneDialog}
        showMarkAsSoldDialog={showMarkAsSoldDialog}
        setShowMarkAsSoldDialog={setShowMarkAsSoldDialog}
        showRelistDialog={showRelistDialog}
        setShowRelistDialog={setShowRelistDialog}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
      />
    </div>
  );
}

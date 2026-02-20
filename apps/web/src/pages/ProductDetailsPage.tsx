import { useEffect, useMemo, useState } from "react";
import { ProductActionDialogs } from "../features/product-details/ProductActionDialogs";
import { ProductDetailsHeader } from "../features/product-details/ProductDetailsHeader";
import { ProductImageGallery } from "../features/product-details/ProductImageGallery";
import { ProductSellerSidebar } from "../features/product-details/ProductSellerSidebar";
import { ProductSummaryCard } from "../features/product-details/ProductSummaryCard";
import {
  countActiveListings,
  formatMemberSince,
  formatPostedAgo,
  resolveDisplayLocationLabel,
} from "../features/product-details/productDetailsUtils";
import { Product, Language } from "../types";
import { translations } from "../translations";
import { api } from "../services/api";
import { normalizeSellerDisplayName } from "../utils/sellerDisplayName";
import { logger } from "../shared/lib/logger";

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

        const joinDate = user?.joinedAt;
        const avatar = user?.avatar;
        const phone = user?.phone;
        let city = user?.city || null;
        let area = user?.area || null;

        const firstName = user?.firstName || "";
        const lastName = user?.lastName || "";
        const fullName = user?.name || `${firstName} ${lastName}`.trim();
        const email = user?.email || "";

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
        logger.warn("[ProductDetailsPage] Failed to fetch seller data:", error);
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
  const memberSinceLabel = useMemo(
    () => formatMemberSince(sellerJoinDate),
    [sellerJoinDate],
  );
  const hasOwnerActions = Boolean(isOwnProduct && onUpdateProduct && onDeleteProduct);

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      <ProductDetailsHeader
        product={product}
        language={language}
        isRTL={isRTL}
        isAuthenticated={isAuthenticated}
        isOwnProduct={isOwnProduct}
        isFavorited={isFavorited}
        onBack={onBack}
        onFavoriteToggle={onFavoriteToggle}
        backToListingsLabel={t.backToListings}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ProductImageGallery product={product} language={language} />

            <ProductSummaryCard
              product={product}
              isRTL={isRTL}
              displayLocationLabel={displayLocationLabel}
              postedAgoLabel={postedAgoLabel}
              displayedViews={displayedViews}
              labels={{
                descriptionTitle: t.descriptionTitle,
                soldOut: t.soldOut,
                views: t.views,
              }}
            />
          </div>

          <ProductSellerSidebar
            language={language}
            isRTL={isRTL}
            product={product}
            publicSellerName={publicSellerName}
            sellerAvatar={sellerAvatar}
            memberSinceLabel={memberSinceLabel}
            activeListingsCount={activeListingsCount}
            displayLocationLabel={displayLocationLabel}
            onSellerClick={onSellerClick}
            onChatWithSeller={onChatWithSeller}
            onShowPhoneDialog={() => setShowPhoneDialog(true)}
            onShowMarkAsSoldDialog={() => setShowMarkAsSoldDialog(true)}
            onShowRelistDialog={() => setShowRelistDialog(true)}
            onShowEditDialog={() => setShowEditDialog(true)}
            onShowDeleteDialog={() => setShowDeleteDialog(true)}
            hasOwnerActions={hasOwnerActions}
            labels={{
              memberSinceShort: t.memberSinceShort,
              activeListingsShort: t.activeListingsShort,
              items: t.items,
              relist: t.relist,
              markAsSold: t.markAsSold,
              viewMyProfile: t.viewMyProfile,
              soldOut: t.soldOut,
              callSeller: t.callSeller,
              viewSellerProfile: t.viewSellerProfile,
              locationTitle: t.locationTitle,
              editPost: t.editPost,
              deletePost: t.deletePost,
            }}
          />
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

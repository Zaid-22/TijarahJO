import type { Product, Language } from "../../types";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

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

export const formatPostedAgo = (
  createdAt: string | undefined,
  nowTimestamp: number,
  language: Language,
  fallbackText: string,
): string => {
  if (!createdAt) {
    return fallbackText;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return fallbackText;
  }

  const diffTime = Math.abs(nowTimestamp - createdDate.getTime());
  const diffDays = Math.floor(diffTime / ONE_DAY_MS);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / ONE_HOUR_MS);
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / ONE_MINUTE_MS);
      return language === "ar"
        ? `نُشر منذ ${diffMinutes} ${diffMinutes === 1 ? "دقيقة" : "دقائق"}`
        : `Posted ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    }

    return language === "ar"
      ? `نُشر منذ ${diffHours} ${diffHours === 1 ? "ساعة" : "ساعات"}`
      : `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  if (diffDays === 1) {
    return language === "ar" ? "نُشر منذ يوم" : "Posted 1 day ago";
  }

  if (diffDays < 7) {
    return language === "ar"
      ? `نُشر منذ ${diffDays} ${diffDays === 2 ? "يومين" : "أيام"}`
      : `Posted ${diffDays} days ago`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return language === "ar"
      ? `نُشر منذ ${weeks} ${weeks === 1 ? "أسبوع" : "أسابيع"}`
      : `Posted ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return language === "ar"
      ? `نُشر منذ ${months} ${months === 1 ? "شهر" : "أشهر"}`
      : `Posted ${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(diffDays / 365);
  return language === "ar"
    ? `نُشر منذ ${years} ${years === 1 ? "سنة" : "سنوات"}`
    : `Posted ${years} ${years === 1 ? "year" : "years"} ago`;
};

export const formatMemberSince = (
  sellerJoinDate: string | null,
  fallback = "Jan 2024",
): string => {
  if (!sellerJoinDate) {
    return fallback;
  }

  const joinDate = new Date(sellerJoinDate);
  if (Number.isNaN(joinDate.getTime())) {
    return fallback;
  }

  const now = new Date();
  const dateToUse = joinDate > now ? now : joinDate;
  return dateToUse.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export const resolveDisplayLocationLabel = ({
  productArea,
  productLocation,
  sellerArea,
  sellerCity,
  jordanLabel,
}: {
  productArea: unknown;
  productLocation: unknown;
  sellerArea: unknown;
  sellerCity: unknown;
  jordanLabel: string;
}): string => {
  const jordanLabels = [jordanLabel, "Jordan", "الأردن"].map((value) =>
    value.toLowerCase(),
  );

  const isJordanLabel = (value: string): boolean =>
    jordanLabels.includes(value.toLowerCase());

  const postArea = normalizeLocationValue(productArea);
  const sellerAreaValue = normalizeLocationValue(sellerArea);
  const resolvedArea = postArea || sellerAreaValue;

  const postCityRaw = normalizeLocationValue(productLocation);
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

  return jordanLabel;
};

export const countActiveListings = (
  allProducts: Product[] | undefined,
  currentProduct: Product,
): number => {
  if (!allProducts) {
    return 0;
  }

  const normalizedCurrentSellerId = String(currentProduct.sellerId || "").trim();
  const normalizedCurrentSellerName = String(currentProduct.seller || "")
    .trim()
    .toLowerCase();

  return allProducts.filter((candidate) => {
    if (candidate.status !== "ACTIVE") {
      return false;
    }

    const candidateSellerId = String(candidate.sellerId || "").trim();
    if (normalizedCurrentSellerId && candidateSellerId) {
      return candidateSellerId === normalizedCurrentSellerId;
    }

    return (
      String(candidate.seller || "")
        .trim()
        .toLowerCase() === normalizedCurrentSellerName
    );
  }).length;
};

export const getDisplayImages = (product: Product): {
  displayImages: string[];
  hasMultipleImages: boolean;
} => {
  const productImages =
    product.images && product.images.length > 0
      ? product.images.filter((img) => img && img.trim() !== "")
      : product.image && product.image.trim() !== ""
        ? [product.image]
        : [];

  const displayImages = productImages.length > 0 ? productImages : [""];
  return {
    displayImages,
    hasMultipleImages: displayImages.length > 1,
  };
};

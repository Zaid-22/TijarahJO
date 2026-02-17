import { Language, Product } from "../../types";

function normalizeLocationValue(value: unknown): string {
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
}

export function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images.filter((img) => img && img.trim() !== "");
  }

  if (product.image && product.image.trim() !== "") {
    return [product.image];
  }

  return [];
}

export function buildDisplayLocationLabel(args: {
  productArea?: string;
  productLocation?: string;
  sellerArea?: string | null;
  sellerCity?: string | null;
  jordanLabel: string;
}): string {
  const { productArea, productLocation, sellerArea, sellerCity, jordanLabel } = args;

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
}

export function getRelativePostedLabel(args: {
  createdAt?: string;
  nowTimestamp: number;
  language: Language;
  fallbackLabel: string;
}): string {
  const { createdAt, nowTimestamp, language, fallbackLabel } = args;

  if (!createdAt) {
    return fallbackLabel;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return fallbackLabel;
  }

  const now = new Date(nowTimestamp);
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
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
}

export function getMemberSinceLabel(joinDateValue: string | null): string {
  if (!joinDateValue) {
    return "Jan 2024";
  }

  const joinDate = new Date(joinDateValue);
  if (Number.isNaN(joinDate.getTime())) {
    return "Jan 2024";
  }

  const now = new Date();
  const dateToUse = joinDate > now ? now : joinDate;

  return dateToUse.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function getActiveListingsCount(
  allProducts: Product[] | undefined,
  product: Product,
): number {
  if (!allProducts) {
    return 0;
  }

  const normalizedCurrentSellerId = String(product.sellerId || "").trim();
  const normalizedCurrentSellerName = String(product.seller || "")
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
      String(candidate.seller || "").trim().toLowerCase() ===
      normalizedCurrentSellerName
    );
  }).length;
}

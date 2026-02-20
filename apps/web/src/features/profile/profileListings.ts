import type { Product } from "../../types";
import type { ProfilePageUserProfile } from "./types";

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLowercase(value: unknown): string {
  return normalizeValue(value).toLowerCase();
}

export interface ProfileListingsResult {
  activeListings: Product[];
  soldListings: Product[];
  normalizedCurrentUserId: string;
}

export function getProfileListings(
  products: Product[],
  userProfile: ProfilePageUserProfile,
  currentUserDisplayName?: string,
): ProfileListingsResult {
  const normalizedCurrentUserId = normalizeValue(userProfile.id);
  const normalizedCurrentUserDisplayName = normalizeLowercase(
    currentUserDisplayName,
  );
  const normalizedProfileName = normalizeLowercase(userProfile.name);

  const myProducts = products.filter((product) => {
    const normalizedSellerId = normalizeValue(product.sellerId);
    const normalizedSellerName = normalizeLowercase(product.seller);

    return (
      (normalizedCurrentUserId.length > 0 &&
        normalizedSellerId === normalizedCurrentUserId) ||
      (normalizedCurrentUserDisplayName.length > 0 &&
        normalizedSellerName === normalizedCurrentUserDisplayName) ||
      (normalizedProfileName.length > 0 &&
        normalizedSellerName === normalizedProfileName)
    );
  });

  return {
    activeListings: myProducts.filter(
      (product) => product.status !== "SOLD" && product.status !== "DELETED",
    ),
    soldListings: myProducts.filter((product) => product.status === "SOLD"),
    normalizedCurrentUserId,
  };
}

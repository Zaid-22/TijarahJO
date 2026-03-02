import type { Post } from "../../types";
import type { ProfilePageUserProfile } from "./types";

function normalizeValue(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLowercase(value: unknown): string {
  return normalizeValue(value).toLowerCase();
}

export interface ProfileListingsResult {
  activeListings: Post[];
  soldListings: Post[];
  normalizedCurrentUserId: string;
}

export function getProfileListings(
  posts: Post[],
  userProfile: ProfilePageUserProfile,
  currentUserDisplayName?: string,
): ProfileListingsResult {
  const normalizedCurrentUserId = normalizeValue(userProfile.id);
  const normalizedCurrentUserDisplayName = normalizeLowercase(
    currentUserDisplayName,
  );
  const normalizedProfileName = normalizeLowercase(userProfile.name);

  const myPosts = posts.filter((post) => {
    const normalizedSellerId = normalizeValue(post.sellerId);
    const normalizedSellerName = normalizeLowercase(post.seller);

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
    activeListings: myPosts.filter(
      (post) => post.status !== "SOLD" && post.status !== "DELETED",
    ),
    soldListings: myPosts.filter((post) => post.status === "SOLD"),
    normalizedCurrentUserId,
  };
}

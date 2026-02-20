import { Product } from "../../../types";
import { toIsoStringOrNow } from "../shared";
import { resolveUserDisplayName } from "../../../utils/userDisplayName";
import { RawPost, RawUserLookup } from "./types";
import { normalizeProductStatus } from "./status";

export { normalizeProductStatus } from "./status";

function normalizePostImages(rawImages: readonly unknown[]): string[] {
  const sanitized = rawImages
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  if (sanitized.length === 0) {
    return [];
  }

  const normalized: string[] = [];
  for (let i = 0; i < sanitized.length; i += 1) {
    const current = sanitized[i];

    const looksLikeSplitDataPrefix =
      current.startsWith("data:") &&
      current.includes(";base64") &&
      !current.includes(",") &&
      i + 1 < sanitized.length;

    if (looksLikeSplitDataPrefix) {
      const payload = sanitized[i + 1];
      if (
        payload &&
        !payload.startsWith("http://") &&
        !payload.startsWith("https://") &&
        !payload.startsWith("data:") &&
        !payload.startsWith("blob:")
      ) {
        normalized.push(`${current},${payload}`);
        i += 1;
        continue;
      }
    }

    normalized.push(current);
  }

  return normalized;
}

function buildDeterministicFallbackPostId(
  postModel: RawPost,
  fallbackIndex?: number,
): string {
  const seedParts = [
    postModel.PostTitle,
    postModel.name,
    postModel.PostDescription,
    postModel.description,
    postModel.UserID,
    postModel.UserId,
    postModel.SellerID,
    postModel.sellerId,
    postModel.CreatedAt,
    postModel.createdAt,
  ]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);

  if (seedParts.length === 0) {
    return fallbackIndex !== undefined
      ? `post-unknown-${fallbackIndex}`
      : "post-unknown";
  }

  const seed = seedParts.join("|").toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const hashPart = Math.abs(hash).toString(36);
  return fallbackIndex !== undefined
    ? `post-${hashPart}-${fallbackIndex}`
    : `post-${hashPart}`;
}

export function getUserIdentifier(user: RawUserLookup): string {
  const userId = user?.UserID ?? user?.userID ?? user?.Id ?? user?.id;
  return userId === null || userId === undefined ? "" : String(userId);
}

export function getUserDisplayName(
  user: RawUserLookup | null | undefined,
  fallbackUserId?: string,
): string {
  return resolveUserDisplayName(
    user as Record<string, unknown> | null | undefined,
    fallbackUserId,
  );
}

export function transformPostModelToProduct(
  postModel: RawPost,
  images: string[] = [],
  fallbackIndex?: number,
): Product {
  const backendImages = Array.isArray(postModel.Images)
    ? postModel.Images
    : Array.isArray(postModel.images)
      ? postModel.images
      : [];
  const singleImage =
    typeof postModel.PostImageURL === "string"
      ? postModel.PostImageURL
      : typeof postModel.postImageURL === "string"
        ? postModel.postImageURL
        : "";
  const preferredImages = images.length > 0 ? images : backendImages;
  const normalizedImages = normalizePostImages(
    preferredImages.length > 0 ? preferredImages : [singleImage],
  );
  const postImages =
    normalizedImages.length > 0
      ? normalizedImages
      : [singleImage].filter((value) => value.length > 0);

  const postId =
    postModel.PostID !== undefined && postModel.PostID !== null
      ? String(postModel.PostID)
      : typeof postModel.id === "string"
        ? postModel.id
        : "";
  const uniqueId =
    postId || buildDeterministicFallbackPostId(postModel, fallbackIndex);

  const name =
    typeof postModel.PostTitle === "string"
      ? postModel.PostTitle
      : typeof postModel.name === "string"
        ? postModel.name
        : "";
  const description =
    typeof postModel.PostDescription === "string"
      ? postModel.PostDescription
      : typeof postModel.description === "string"
        ? postModel.description
        : "";

  const city =
    typeof postModel.City === "string"
      ? postModel.City
      : typeof postModel.Location === "string"
        ? postModel.Location
        : typeof postModel.location === "string"
          ? postModel.location
          : "Jordan";
  const area =
    typeof postModel.Area === "string"
      ? postModel.Area
      : typeof postModel.area === "string"
        ? postModel.area
        : undefined;

  const seller =
    typeof postModel.Seller === "string"
      ? postModel.Seller
      : typeof postModel.seller === "string"
        ? postModel.seller
        : "Unknown";
  const sellerId =
    postModel.UserID !== undefined && postModel.UserID !== null
      ? String(postModel.UserID)
      : postModel.UserId !== undefined && postModel.UserId !== null
        ? String(postModel.UserId)
        : postModel.SellerID !== undefined && postModel.SellerID !== null
          ? String(postModel.SellerID)
          : typeof postModel.sellerId === "string"
            ? postModel.sellerId
            : "";

  const category =
    typeof postModel.Category === "string"
      ? postModel.Category
      : typeof postModel.category === "string"
        ? postModel.category
        : "Unknown";
  const categoryId =
    postModel.CategoryID !== undefined && postModel.CategoryID !== null
      ? String(postModel.CategoryID)
      : postModel.CategoryId !== undefined && postModel.CategoryId !== null
        ? String(postModel.CategoryId)
        : postModel.categoryId !== undefined && postModel.categoryId !== null
          ? String(postModel.categoryId)
          : "";

  return {
    id: uniqueId,
    name,
    price:
      typeof postModel.Price === "number"
        ? postModel.Price
        : typeof postModel.price === "number"
          ? postModel.price
          : 0,
    location: city || "Jordan",
    area,
    seller,
    sellerId,
    category,
    categoryId,
    image: postImages[0] ?? "",
    images: postImages,
    description,
    createdAt: toIsoStringOrNow(postModel.CreatedAt ?? postModel.createdAt),
    views:
      typeof postModel.Views === "number"
        ? postModel.Views
        : typeof postModel.views === "number"
          ? postModel.views
          : 0,
    status: normalizeProductStatus(postModel.Status ?? postModel.status),
  };
}

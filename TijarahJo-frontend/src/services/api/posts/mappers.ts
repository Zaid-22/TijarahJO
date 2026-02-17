import { Product } from "../../../types";
import { toIsoStringOrNow } from "../shared";
import {
  ProductStatus,
  RawPost,
  RawUserLookup,
} from "./types";

export function normalizeProductStatus(rawStatus: unknown): ProductStatus {
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toUpperCase();
    if (normalized === "SOLD") {
      return "SOLD";
    }
    if (
      normalized === "DELETED" ||
      normalized === "BLOCKED" ||
      normalized === "INACTIVE"
    ) {
      return "DELETED";
    }
    return "ACTIVE";
  }

  const numericStatus = Number(rawStatus);
  if (numericStatus === 3) {
    return "SOLD";
  }
  if (numericStatus === 1 || numericStatus === 2) {
    return "DELETED";
  }
  return "ACTIVE";
}

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

export function getUserIdentifier(user: RawUserLookup): string {
  const userId = user?.UserID ?? user?.userID ?? user?.Id ?? user?.id;
  return userId === null || userId === undefined ? "" : String(userId);
}

export function getUserDisplayName(
  user: RawUserLookup | null | undefined,
  fallbackUserId?: string,
): string {
  if (!user) {
    return fallbackUserId ? `User ${fallbackUserId}` : "Unknown";
  }

  const explicitName = user.Name || user.name;
  if (typeof explicitName === "string" && explicitName.trim()) {
    return explicitName.trim();
  }

  const firstName =
    typeof user.FirstName === "string"
      ? user.FirstName
      : typeof user.firstName === "string"
        ? user.firstName
        : "";
  const lastName =
    typeof user.LastName === "string"
      ? user.LastName
      : typeof user.lastName === "string"
        ? user.lastName
        : "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email =
    typeof user.Email === "string"
      ? user.Email
      : typeof user.email === "string"
        ? user.email
        : "";
  if (email) {
    return email;
  }

  return fallbackUserId ? `User ${fallbackUserId}` : "Unknown";
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
    postId ||
    (fallbackIndex !== undefined
      ? `post-${fallbackIndex}`
      : `post-${Date.now()}-${Math.random()}`);

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

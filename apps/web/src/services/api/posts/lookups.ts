import { apiRequest } from "../client";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { getUserDisplayName, getUserIdentifier } from "./mappers";
import { RawCategory, RawPost, RawPostImage, RawUserLookup } from "./types";

export const POST_IMAGES_ENDPOINT = "/post-images";
const USERS_ENDPOINT = "/users";

let categoriesCache: Record<string, string> | null = null;
let categoryIdByNameCache: Record<string, number> | null = null;
let usersCache: Record<string, string> | null = null;

let postImageRowsByPostIdCache: Record<
  string,
  { rows: RawPostImage[]; updatedAt: number }
> = {};
let categoriesCacheUpdatedAt = 0;
let usersCacheUpdatedAt = 0;

let usersAllEndpointAccessible: boolean | null = null;

const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
}

function normalizeCategoryNameKey(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

function normalizePostId(postId: unknown): string {
  return String(postId ?? "").trim();
}

function isDeletedImageFlag(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return false;
}

function extractPostImageUrl(imageRow: RawPostImage): string {
  if (isDeletedImageFlag(imageRow?.IsDeleted)) {
    return "";
  }

  const imageUrlRaw = imageRow?.PostImageURL;
  if (typeof imageUrlRaw !== "string") {
    return "";
  }

  return imageUrlRaw.trim();
}

function mapPostImageRowsToUrls(imageRows: RawPostImage[]): string[] {
  return imageRows
    .map((imageRow) => extractPostImageUrl(imageRow))
    .filter((imageUrl) => imageUrl.length > 0);
}

export function invalidatePostImagesCache() {
  postImageRowsByPostIdCache = {};
}

export async function getPostImagesByPostId(
  postId: string,
  forceRefresh: boolean = false,
): Promise<string[]> {
  const imageRows = await getPostImageRowsByPostId(postId, forceRefresh);
  return mapPostImageRowsToUrls(imageRows);
}

export async function getPostImageRowsByPostId(
  postId: string,
  forceRefresh: boolean = false,
): Promise<RawPostImage[]> {
  const normalizedPostId = normalizePostId(postId);
  if (!normalizedPostId) {
    return [];
  }

  const cachedEntry = postImageRowsByPostIdCache[normalizedPostId];
  if (!forceRefresh && cachedEntry && isCacheFresh(cachedEntry.updatedAt)) {
    return cachedEntry.rows;
  }

  const imagesResponse = await apiRequest<RawPostImage[]>(
    `${POST_IMAGES_ENDPOINT}/post/${encodeURIComponent(normalizedPostId)}`,
    {
      method: "GET",
    },
  );

  if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
    postImageRowsByPostIdCache[normalizedPostId] = {
      rows: imagesResponse.data,
      updatedAt: Date.now(),
    };
    return imagesResponse.data;
  }

  return cachedEntry?.rows || [];
}

async function ensureCategoriesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, string>> {
  if (
    !forceRefresh &&
    categoriesCache &&
    isCacheFresh(categoriesCacheUpdatedAt)
  ) {
    return categoriesCache;
  }

  const categoriesResponse = await apiRequest<RawCategory[]>("/categories", {
    method: "GET",
  });

  if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
    const nextCategoriesCache: Record<string, string> = {};
    const nextCategoryIdByNameCache: Record<string, number> = {};

    categoriesResponse.data.forEach((cat) => {
      const categoryId = toPositiveIntegerId(
        cat?.CategoryID ?? cat?.categoryID ?? cat?.id,
      );
      const rawCategoryName =
        cat?.CategoryName ?? cat?.categoryName ?? cat?.name;
      const categoryName =
        typeof rawCategoryName === "string" ? rawCategoryName.trim() : "";

      if (categoryId && categoryName.length > 0) {
        nextCategoriesCache[String(categoryId)] = categoryName;
        nextCategoryIdByNameCache[normalizeCategoryNameKey(categoryName)] =
          categoryId;
      }
    });

    categoriesCache = nextCategoriesCache;
    categoryIdByNameCache = nextCategoryIdByNameCache;
    categoriesCacheUpdatedAt = Date.now();
    return categoriesCache;
  }

  if (!categoriesCache) {
    categoriesCache = {};
  }
  if (!categoryIdByNameCache) {
    categoryIdByNameCache = {};
  }
  return categoriesCache;
}

export async function resolveCategoryId(
  categoryValue: unknown,
  forceRefresh: boolean = false,
): Promise<number | undefined> {
  const numericCategoryId = toPositiveIntegerId(categoryValue);
  if (numericCategoryId) {
    return numericCategoryId;
  }

  if (typeof categoryValue !== "string") {
    return undefined;
  }

  const normalizedCategoryName = normalizeCategoryNameKey(categoryValue);
  if (!normalizedCategoryName) {
    return undefined;
  }

  await ensureCategoriesCache(forceRefresh);
  return toPositiveIntegerId(categoryIdByNameCache?.[normalizedCategoryName]);
}

async function ensureUsersCache(
  forceRefresh: boolean = false,
  userIds: Array<string | number> = [],
): Promise<Record<string, string>> {
  if (!usersCache) {
    usersCache = {};
  }

  const requestedUserIds = Array.from(
    new Set(
      userIds
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0 && id !== "0"),
    ),
  );

  const shouldRefreshAllUsersCache =
    forceRefresh ||
    !isCacheFresh(usersCacheUpdatedAt) ||
    Object.keys(usersCache).length === 0;

  if (shouldRefreshAllUsersCache && usersAllEndpointAccessible !== false) {
    const usersResponse = await apiRequest<RawUserLookup[]>(USERS_ENDPOINT, {
      method: "GET",
    });

    if (usersResponse.success && Array.isArray(usersResponse.data)) {
      const nextCache: Record<string, string> = {};
      usersResponse.data.forEach((user) => {
        const userId = getUserIdentifier(user);
        if (!userId) {
          return;
        }

        nextCache[userId] = getUserDisplayName(user, userId);
      });

      usersCache = nextCache;
      usersCacheUpdatedAt = Date.now();
      usersAllEndpointAccessible = true;
    } else if (!usersResponse.success) {
      const errorCode = usersResponse.error?.code || "";
      if (errorCode === "HTTP_401" || errorCode === "HTTP_403") {
        usersAllEndpointAccessible = false;
      }
    }
  }

  const missingUserIds = requestedUserIds.filter((id) => !usersCache?.[id]);

  if (missingUserIds.length > 0) {
    await Promise.all(
      missingUserIds.map(async (userId) => {
        const userResponse = await apiRequest<RawUserLookup>(
          `/users/${userId}`,
          {
            method: "GET",
          },
        );

        if (userResponse.success && userResponse.data) {
          const resolvedUserId = getUserIdentifier(userResponse.data) || userId;
          const displayName = getUserDisplayName(
            userResponse.data,
            resolvedUserId,
          );

          usersCache![resolvedUserId] = displayName;
          usersCache![userId] = displayName;
          return;
        }

        usersCache![userId] = `User ${userId}`;
      }),
    );
    usersCacheUpdatedAt = Date.now();
  }

  return usersCache;
}

export async function enrichPostsWithCategoryAndSeller(
  posts: RawPost[],
  forceRefresh: boolean = false,
): Promise<RawPost[]> {
  const postUserIds: Array<string | number> = posts
    .map(
      (post) =>
        post?.UserID ??
        post?.userID ??
        post?.UserId ??
        post?.sellerId ??
        post?.SellerId ??
        post?.SellerID,
    )
    .filter(
      (id): id is string | number =>
        (typeof id === "string" || typeof id === "number") &&
        id !== null &&
        id !== undefined &&
        String(id).trim() !== "" &&
        String(id) !== "0",
    );

  const [resolvedCategories, resolvedUsers] = await Promise.all([
    ensureCategoriesCache(forceRefresh),
    ensureUsersCache(forceRefresh, postUserIds),
  ]);

  return posts.map((post) => {
    const categoryId = post?.CategoryID ?? post?.categoryID ?? post?.CategoryId;
    const userId =
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId ??
      post?.SellerID;

    let categoryName = String(post?.Category || post?.category || "").trim();
    if (!categoryName) {
      categoryName =
        categoryId !== null && categoryId !== undefined
          ? resolvedCategories[String(categoryId)] || "Unknown"
          : "Unknown";
    }

    const existingSeller =
      typeof (post?.Seller ?? post?.seller) === "string"
        ? String(post?.Seller ?? post?.seller).trim()
        : "";
    let sellerName = existingSeller;
    if (!sellerName) {
      sellerName =
        userId !== null && userId !== undefined
          ? resolvedUsers[String(userId)] || `User ${userId}`
          : "Unknown";
    }

    return {
      ...post,
      Category: categoryName,
      Seller: sellerName,
    };
  });
}

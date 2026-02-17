import { apiRequest } from "../client";
import { getUserDisplayName, getUserIdentifier } from "./mappers";
import {
  RawCategory,
  RawPost,
  RawPostImage,
  RawUserLookup,
} from "./types";

let categoriesCache: Record<string, string> | null = null;
let usersCache: Record<string, string> | null = null;
let postImagesCache: RawPostImage[] | null = null;
let postImagesByPostIdCache: Record<
  string,
  { images: string[]; updatedAt: number }
> = {};
let categoriesCacheUpdatedAt = 0;
let usersCacheUpdatedAt = 0;
let postImagesCacheUpdatedAt = 0;
let usersAllEndpointAccessible: boolean | null = null;

const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
}

export function clearCaches() {
  categoriesCache = null;
  usersCache = null;
  postImagesCache = null;
  postImagesByPostIdCache = {};
  categoriesCacheUpdatedAt = 0;
  usersCacheUpdatedAt = 0;
  postImagesCacheUpdatedAt = 0;
  usersAllEndpointAccessible = null;
}

export function invalidatePostImagesCache() {
  postImagesCache = null;
  postImagesByPostIdCache = {};
  postImagesCacheUpdatedAt = 0;
}

export function groupImagesByPostId(
  images: RawPostImage[],
): Record<string, string[]> {
  const imagesByPostId: Record<string, string[]> = {};

  images.forEach((img) => {
    const postId = img?.PostID?.toString() || "";
    const imageUrl = img?.PostImageURL;
    if (!postId || !imageUrl || typeof imageUrl !== "string") {
      return;
    }
    if (img?.IsDeleted) {
      return;
    }

    const normalizedUrl = imageUrl.trim();
    if (!normalizedUrl) {
      return;
    }

    if (!imagesByPostId[postId]) {
      imagesByPostId[postId] = [];
    }
    imagesByPostId[postId].push(normalizedUrl);
  });

  return imagesByPostId;
}

export async function getAllPostImages(
  forceRefresh: boolean = false,
): Promise<RawPostImage[]> {
  if (!forceRefresh && postImagesCache && isCacheFresh(postImagesCacheUpdatedAt)) {
    return postImagesCache;
  }

  const imagesResponse = await apiRequest<RawPostImage[]>("/TbPostImages/All", {
    method: "GET",
  });

  if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
    postImagesCache = imagesResponse.data;
    postImagesCacheUpdatedAt = Date.now();
    return postImagesCache;
  }

  return postImagesCache || [];
}

export async function getPostImagesByPostId(
  postId: string,
  forceRefresh: boolean = false,
): Promise<string[]> {
  const normalizedPostId = String(postId || "").trim();
  if (!normalizedPostId) {
    return [];
  }

  const cachedEntry = postImagesByPostIdCache[normalizedPostId];
  if (!forceRefresh && cachedEntry && isCacheFresh(cachedEntry.updatedAt)) {
    return cachedEntry.images;
  }

  const imagesResponse = await apiRequest<RawPostImage[]>(
    `/TbPostImages/post/${encodeURIComponent(normalizedPostId)}`,
    {
      method: "GET",
    },
  );

  if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
    const images = imagesResponse.data
      .map((imageRow) =>
        typeof imageRow?.PostImageURL === "string"
          ? imageRow.PostImageURL.trim()
          : "",
      )
      .filter((value) => value.length > 0);

    postImagesByPostIdCache[normalizedPostId] = {
      images,
      updatedAt: Date.now(),
    };
    return images;
  }

  return cachedEntry?.images || [];
}

async function ensureCategoriesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, string>> {
  if (!forceRefresh && categoriesCache && isCacheFresh(categoriesCacheUpdatedAt)) {
    return categoriesCache;
  }

  const categoriesResponse = await apiRequest<RawCategory[]>("/categories/All", {
    method: "GET",
  });

  if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
    const nextCache: Record<string, string> = {};
    categoriesResponse.data.forEach((cat) => {
      const catId = cat?.CategoryID ?? cat?.categoryID ?? cat?.id;
      const catName = cat?.CategoryName || cat?.categoryName || cat?.name;
      if (catId !== null && catId !== undefined && catName) {
        nextCache[String(catId)] = String(catName);
      }
    });

    categoriesCache = nextCache;
    categoriesCacheUpdatedAt = Date.now();
    return categoriesCache;
  }

  if (!categoriesCache) {
    categoriesCache = {};
  }
  return categoriesCache;
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
    const usersResponse = await apiRequest<RawUserLookup[]>("/users/All", {
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
        const userResponse = await apiRequest<RawUserLookup>(`/users/${userId}`, {
          method: "GET",
        });

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

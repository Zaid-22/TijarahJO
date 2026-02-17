import {
  CreatePostRequest,
  PostResponse,
  PostsListResponse,
  SearchRequest,
  UpdatePostRequest,
} from "../../types/api";
import { Product } from "../../types";
import { authApi } from "./auth";
import { apiRequest, debugError, debugLog, debugWarn } from "./client";
import {
  decodeJwtPayload,
  isCurrentSessionAdmin,
  toIsoStringOrNow,
} from "./shared";

function normalizeProductStatus(rawStatus: unknown): "ACTIVE" | "SOLD" | "DELETED" {
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

let categoriesCache: Record<string, string> | null = null;
let usersCache: Record<string, string> | null = null;
let postImagesCache: any[] | null = null;
let categoriesCacheUpdatedAt = 0;
let usersCacheUpdatedAt = 0;
let postImagesCacheUpdatedAt = 0;
let usersAllEndpointAccessible: boolean | null = null;
const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
}

function invalidatePostImagesCache() {
  postImagesCache = null;
  postImagesCacheUpdatedAt = 0;
}

function groupImagesByPostId(images: any[]): Record<string, string[]> {
  const imagesByPostId: Record<string, string[]> = {};

  images.forEach((img: any) => {
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

async function getAllPostImages(forceRefresh: boolean = false): Promise<any[]> {
  if (!forceRefresh && postImagesCache && isCacheFresh(postImagesCacheUpdatedAt)) {
    return postImagesCache;
  }

  const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
    method: "GET",
  });

  if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
    postImagesCache = imagesResponse.data;
    postImagesCacheUpdatedAt = Date.now();
    return postImagesCache;
  }

  return postImagesCache || [];
}

async function ensureCategoriesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, string>> {
  if (!forceRefresh && categoriesCache && isCacheFresh(categoriesCacheUpdatedAt)) {
    return categoriesCache;
  }

  const categoriesResponse = await apiRequest<any[]>("/categories/All", {
    method: "GET",
  });

  if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
    const nextCache: Record<string, string> = {};
    categoriesResponse.data.forEach((cat: any) => {
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

function getUserIdentifier(user: any): string {
  const userId = user?.UserID ?? user?.userID ?? user?.Id ?? user?.id;
  return userId === null || userId === undefined ? "" : String(userId);
}

function getUserDisplayName(user: any, fallbackUserId?: string): string {
  const explicitName = user?.Name || user?.name;
  if (typeof explicitName === "string" && explicitName.trim()) {
    return explicitName.trim();
  }

  const firstName = user?.FirstName || user?.firstName || "";
  const lastName = user?.LastName || user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email = user?.Email || user?.email || "";
  if (email) {
    return email;
  }

  return fallbackUserId ? `User ${fallbackUserId}` : "Unknown";
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
    forceRefresh || !isCacheFresh(usersCacheUpdatedAt) || Object.keys(usersCache).length === 0;

  if (
    shouldRefreshAllUsersCache &&
    usersAllEndpointAccessible !== false &&
    isCurrentSessionAdmin()
  ) {
    const usersResponse = await apiRequest<any[]>("/users/All", {
      method: "GET",
    });

    if (usersResponse.success && Array.isArray(usersResponse.data)) {
      const nextCache: Record<string, string> = {};
      usersResponse.data.forEach((user: any) => {
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
        const userResponse = await apiRequest<any>(`/users/${userId}`, {
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

async function enrichPostsWithCategoryAndSeller(
  posts: any[],
  forceRefresh: boolean = false,
): Promise<any[]> {
  const postUserIds = posts
    .map((post: any) =>
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId,
    )
    .filter(
      (id: any) =>
        id !== null &&
        id !== undefined &&
        String(id).trim() !== "" &&
        String(id) !== "0",
    );

  const [resolvedCategories, resolvedUsers] = await Promise.all([
    ensureCategoriesCache(forceRefresh),
    ensureUsersCache(forceRefresh, postUserIds),
  ]);

  return posts.map((post: any) => {
    const categoryId = post?.CategoryID ?? post?.categoryID;
    const userId =
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId;

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

/**
 * Clear caches - call this when data might have changed (e.g., after creating a post)
 */
export function clearCaches() {
  categoriesCache = null;
  usersCache = null;
  postImagesCache = null;
  categoriesCacheUpdatedAt = 0;
  usersCacheUpdatedAt = 0;
  postImagesCacheUpdatedAt = 0;
  usersAllEndpointAccessible = null;
}

export function transformPostModelToProduct(
  postModel: any,
  images: string[] = [],
  fallbackIndex?: number,
): Product {
  const normalizePostImages = (rawImages: unknown[]): string[] => {
    const sanitized = rawImages
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

    if (sanitized.length === 0) {
      return [];
    }

    const normalized: string[] = [];
    for (let i = 0; i < sanitized.length; i += 1) {
      const current = sanitized[i];

      // Backend list endpoints may split data URLs at the first comma.
      // Rebuild `data:*;base64,<payload>` when needed.
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
  };

  // Get images for this post
  // Handle various casing valid from backend or frontend
  const backendImages = postModel.Images || postModel.images || [];
  const singleImage = postModel.PostImageURL || postModel.postImageURL || "";
  const preferredImages = images.length > 0 ? images : backendImages;
  const normalizedImages = normalizePostImages(
    preferredImages.length > 0 ? preferredImages : [singleImage],
  );
  const postImages = normalizedImages.length > 0 ? normalizedImages : [singleImage].filter(Boolean);

  // Ensure we always have a unique ID - use fallback index if needed
  const postId = postModel.PostID?.toString() || postModel.id;
  const uniqueId =
    postId ||
    (fallbackIndex !== undefined
      ? `post-${fallbackIndex}`
      : `post-${Date.now()}-${Math.random()}`);

  const name = postModel.PostTitle ?? postModel.name ?? "";
  const description = postModel.PostDescription ?? postModel.description ?? "";

  return {
    id: uniqueId,
    name: name,
    price: postModel.Price ?? postModel.price ?? 0,
    location: postModel.City ?? postModel.Location ?? postModel.location ?? "Jordan",
    area: postModel.Area ?? postModel.area,
    seller: postModel.Seller ?? postModel.seller ?? "Unknown",
    sellerId:
      postModel.UserID?.toString() ??
      postModel.UserId?.toString() ??
      postModel.SellerID?.toString() ??
      postModel.sellerId ??
      "",
    category: postModel.Category ?? postModel.category ?? "Unknown",
    categoryId:
      postModel.CategoryID?.toString() ??
      postModel.CategoryId?.toString() ??
      postModel.categoryId ??
      "",
    image: postImages[0] ?? "",
    images: postImages,
    description: description,
    createdAt: toIsoStringOrNow(postModel.CreatedAt ?? postModel.createdAt),
    views: postModel.Views ?? postModel.views ?? 0,
    status: normalizeProductStatus(postModel.Status ?? postModel.status),
  };
}

export const postsApi = {
  /**
   * Get all posts with optional filters and pagination
   */
  getPosts: async (params?: SearchRequest): Promise<PostsListResponse> => {
    const isPaginatedRequest =
      params?.page !== undefined || params?.limit !== undefined;
    const pageNumber =
      params?.page && Number.isFinite(params.page) && params.page > 0
        ? Math.floor(params.page)
        : 1;
    const rowsPerPage =
      params?.limit && Number.isFinite(params.limit) && params.limit > 0
        ? Math.min(500, Math.floor(params.limit))
        : 20;

    const normalizePagination = (
      pagination: any,
      fallbackPage: number,
      fallbackRowsPerPage: number,
      fallbackTotalPosts: number,
    ) => {
      const resolvedCurrentPage =
        Number.isFinite(Number(pagination?.currentPage)) &&
        Number(pagination.currentPage) > 0
          ? Math.floor(Number(pagination.currentPage))
          : fallbackPage;

      const resolvedRowsPerPage =
        Number.isFinite(Number(pagination?.postsPerPage)) &&
        Number(pagination.postsPerPage) > 0
          ? Math.floor(Number(pagination.postsPerPage))
          : fallbackRowsPerPage;

      const resolvedTotalPosts =
        Number.isFinite(Number(pagination?.totalPosts)) &&
        Number(pagination.totalPosts) >= 0
          ? Math.floor(Number(pagination.totalPosts))
          : fallbackTotalPosts;

      const resolvedTotalPages =
        Number.isFinite(Number(pagination?.totalPages)) &&
        Number(pagination.totalPages) >= 0
          ? Math.floor(Number(pagination.totalPages))
          : resolvedTotalPosts > 0
            ? Math.ceil(resolvedTotalPosts / resolvedRowsPerPage)
            : 0;

      return {
        currentPage: resolvedCurrentPage,
        totalPages: resolvedTotalPages,
        totalPosts: resolvedTotalPosts,
        postsPerPage: resolvedRowsPerPage,
      };
    };

    const fetchFeedPage = async (page: number, limit: number) => {
      const response = await apiRequest<any>(
        `/posts/feed?page=${page}&limit=${limit}&includeDeleted=false`,
        { method: "GET" },
      );

      if (
        !response.success ||
        !response.data ||
        !Array.isArray(response.data.posts)
      ) {
        return null;
      }

      const posts = response.data.posts.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          Array.isArray(post?.images) ? post.images : [],
          index,
        ),
      );

      return {
        posts,
        pagination: normalizePagination(
          response.data.pagination,
          page,
          limit,
          posts.length,
        ),
      };
    };

    if (isPaginatedRequest) {
      const pagedFeed = await fetchFeedPage(pageNumber, rowsPerPage);
      if (pagedFeed) {
        return {
          success: true,
          posts: pagedFeed.posts,
          pagination: pagedFeed.pagination,
        };
      }
    } else {
      const feedPageSize = 500;
      const firstFeedPage = await fetchFeedPage(1, feedPageSize);
      if (firstFeedPage) {
        const totalPages = firstFeedPage.pagination.totalPages;
        if (totalPages <= 1) {
          return {
            success: true,
            posts: firstFeedPage.posts,
            pagination: {
              currentPage: 1,
              totalPages: firstFeedPage.posts.length > 0 ? 1 : 0,
              totalPosts: firstFeedPage.posts.length,
              postsPerPage:
                firstFeedPage.posts.length > 0 ? firstFeedPage.posts.length : 20,
            },
          };
        }

        const remainingPages = Array.from(
          { length: totalPages - 1 },
          (_, index) => index + 2,
        );
        const remainingResults = await Promise.all(
          remainingPages.map((page) => fetchFeedPage(page, feedPageSize)),
        );

        const hasFeedGap = remainingResults.some((result) => result === null);
        if (!hasFeedGap) {
          const allPosts = [...firstFeedPage.posts];
          remainingResults.forEach((result) => {
            if (result) {
              allPosts.push(...result.posts);
            }
          });

          return {
            success: true,
            posts: allPosts,
            pagination: {
              currentPage: 1,
              totalPages: allPosts.length > 0 ? 1 : 0,
              totalPosts: allPosts.length,
              postsPerPage: allPosts.length > 0 ? allPosts.length : 20,
            },
          };
        }

        debugWarn(
          "[postsApi.getPosts] Feed returned partial pages. Falling back to legacy endpoint.",
        );
      }
    }

    // Legacy fallback for environments where /posts/feed is not yet available.
    if (isPaginatedRequest) {
      const response = await apiRequest<any[]>(
        `/posts/pagination?PageNumber=${pageNumber}&RowsPerPage=${rowsPerPage}&IncludeDeleted=false`,
        { method: "GET" },
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        const allImages = await getAllPostImages();
        const imagesByPostId = groupImagesByPostId(allImages);

        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data,
        );

        const posts = enrichedPosts.map((post: any) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || [],
          ),
        );

        return {
          success: true,
          posts,
          pagination: {
            currentPage: pageNumber,
            totalPages:
              response.data.length > 0
                ? Math.ceil(posts.length / rowsPerPage)
                : 0,
            totalPosts: posts.length,
            postsPerPage: rowsPerPage,
          },
        };
      }
    } else {
      const response = await apiRequest<any[]>("/posts/All", {
        method: "GET",
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data,
        );

        const allImages = await getAllPostImages();
        const imagesByPostId = groupImagesByPostId(allImages);
        const posts = enrichedPosts.map((post: any, index: number) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || [],
            index,
          ),
        );

        return {
          success: true,
          posts,
          pagination: {
            currentPage: 1,
            totalPages: response.data.length > 0 ? 1 : 0,
            totalPosts: posts.length,
            postsPerPage: posts.length > 0 ? posts.length : 20,
          },
        };
      }
    }

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: 20,
      },
    };
  },

  /**
   * Get single post by ID
   */
  getPost: async (id: string): Promise<Product | null> => {
    const response = await apiRequest<any>(`/posts/${id}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      // Get images for this post
      const allImages = await getAllPostImages();

      const postImages = allImages
        .filter((img: any) => img.PostID?.toString() === id && !img.IsDeleted)
        .map((img: any) => img.PostImageURL)
        .filter((url: string) => url && url.trim() !== "");

      // Enrich post with category and seller names before transforming
      const enrichedPost = await enrichPostsWithCategoryAndSeller([
        response.data,
      ]);
      const enrichedPostData = enrichedPost[0] || response.data;

      const transformed = transformPostModelToProduct(
        enrichedPostData,
        postImages,
      );

      return transformed;
    }

    return null;
  },

  /**
   * Create new post
   */
  createPost: async (postData: CreatePostRequest): Promise<PostResponse> => {
    // Get current user ID from JWT token by calling /auth/me endpoint
    let userId = "";
    try {
      const currentUserResponse = await authApi.getCurrentUser();
      if (currentUserResponse.success && currentUserResponse.data) {
        const user = currentUserResponse.data as any;
        userId = (user.Id || user.id || "").toString();
        debugLog("[createPost] Got user ID from /auth/me:", userId);
      } else {
        debugWarn("[createPost] Failed to get current user from /auth/me");
      }
    } catch (error) {
      debugError("[createPost] Error getting current user:", error);
    }

    // Try to decode JWT token as fallback
    if (!userId) {
      try {
        const token = localStorage.getItem("tijarahjo_token");
        if (token) {
          const payload = decodeJwtPayload(token);
          userId = String(payload?.nameid ?? payload?.sub ?? "");
          debugLog("[createPost] Got user ID from JWT token:", userId);
        }
      } catch (tokenError) {
        debugError("[createPost] Error decoding token:", tokenError);
      }
    }

    // If still no user ID, throw error instead of defaulting to admin
    if (!userId || userId === "" || userId === "0") {
      const errorMsg =
        "Cannot create post: User not authenticated. Please log in first.";
      debugError("[createPost]", errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: {
          code: "UNAUTHORIZED",
          message: errorMsg,
        },
      } as any;
    }

    // Find category ID by name
    const categoriesResponse = await apiRequest<any[]>("/categories/All", {
      method: "GET",
    });
    const categories = categoriesResponse.success
      ? categoriesResponse.data || []
      : [];
    const normalizedCategory = (postData.category || "").trim();
    const category = categories.find(
      (cat: any) =>
        cat.CategoryName?.toLowerCase() ===
        normalizedCategory.toLowerCase(),
    );

    let categoryId =
      category?.CategoryID !== undefined && category?.CategoryID !== null
        ? Number(category.CategoryID)
        : Number.NaN;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      const parsedCategoryId = Number.parseInt(normalizedCategory, 10);
      if (Number.isInteger(parsedCategoryId) && parsedCategoryId > 0) {
        categoryId = parsedCategoryId;
      }
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      const errorMsg =
        "Cannot create post: selected category is invalid or not available.";
      return {
        success: false,
        message: errorMsg,
        error: {
          code: "INVALID_CATEGORY",
          message: errorMsg,
        },
      } as any;
    }

    // Map frontend format to backend PostModel format
    const backendPost = {
      PostID: null,
      UserID: parseInt(userId),
      CategoryID: categoryId,
      PostTitle: postData.title,
      PostDescription: postData.description || "",
      Price: postData.price,
      Status: 0, // 0 = ACTIVE
      CreatedAt: new Date().toISOString(),
      IsDeleted: false,
      City: postData.location || postData.city || "Jordan",
      Area: postData.area || null,
    };

    const response = await apiRequest<any>("/posts", {
      method: "POST",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      const postId = response.data.PostID || response.data.postID;
      debugLog("[createPost] Post created with ID:", postId);

      // Create post images
      const savedImageUrls: string[] = [];
      if (postData.images && postData.images.length > 0) {
        debugLog(
          "[createPost] Creating",
          postData.images.length,
          "images for post",
          postId,
        );
        const imagePromises = postData.images.map(async (imageUrl, index) => {
          if (!imageUrl || imageUrl.trim() === "") {
            debugWarn(
              `[createPost] Skipping empty image URL at index ${index}`,
            );
            return null;
          }

          try {
            const imageResponse = await apiRequest<any>("/TbPostImages", {
              method: "POST",
              body: JSON.stringify({
                PostID: postId,
                PostImageURL: imageUrl,
                UploadedAt: new Date().toISOString(),
                IsDeleted: false,
              }),
            });

            if (imageResponse.success && imageResponse.data) {
              debugLog(
                `[createPost] Image ${index + 1} created successfully:`,
                imageResponse.data,
              );
              savedImageUrls.push(imageUrl);
              return imageResponse.data;
            } else {
              const errorMsg =
                !imageResponse.success && "error" in imageResponse
                  ? imageResponse.error?.message || "Unknown error"
                  : "Unknown error";
              debugError(
                `[createPost] Failed to create image ${index + 1}:`,
                errorMsg,
              );
              return null;
            }
          } catch (error) {
            debugError(
              `[createPost] Error creating image ${index + 1}:`,
              error,
            );
            return null;
          }
        });

        const imageResults = await Promise.all(imagePromises);
        const successfulImages = imageResults.filter((img) => img !== null);
        debugLog(
          `[createPost] Successfully created ${successfulImages.length} out of ${postData.images.length} images`,
        );
        if (successfulImages.length > 0) {
          invalidatePostImagesCache();
        }
      } else {
        debugLog("[createPost] No images to create");
      }

      // Enrich post with category and seller names before transforming
      const enrichedPost = await enrichPostsWithCategoryAndSeller([
        response.data,
      ]);
      const enrichedPostData = enrichedPost[0] || response.data;

      // Preserve location and area from postData (not stored in backend yet)
      enrichedPostData.Location =
        postData.location || postData.city || "Jordan";
      enrichedPostData.Area = postData.area || null;

      const product = transformPostModelToProduct(
        enrichedPostData,
        savedImageUrls.length > 0 ? savedImageUrls : postData.images || [],
      );
      return {
        success: true,
        post: product,
      };
    }

    let errorMessage = "Failed to create post";
    if (!response.success) {
      if ("error" in response) {
        errorMessage = response.error?.message || "Failed to create post";
      }
    }
    return {
      success: false,
      message: errorMessage,
    };
  },

  /**
   * Update existing post
   */
  updatePost: async (postData: UpdatePostRequest): Promise<PostResponse> => {
    // Get current post to preserve fields
    const currentPostResponse = await apiRequest<any>(`/posts/${postData.id}`, {
      method: "GET",
    });
    if (!currentPostResponse.success || !currentPostResponse.data) {
      return { success: false, message: "Post not found" };
    }

    const currentPost = currentPostResponse.data;
    const resolvedDescription =
      postData.description !== undefined
        ? postData.description
        : currentPost.PostDescription ?? "";
    const resolvedCityRaw =
      postData.location ?? postData.city ?? currentPost.City ?? "Jordan";
    const resolvedCity =
      typeof resolvedCityRaw === "string" && resolvedCityRaw.trim()
        ? resolvedCityRaw.trim()
        : "Jordan";
    const resolvedArea =
      postData.area !== undefined
        ? postData.area?.trim() || null
        : currentPost.Area ?? null;
    const currentStatusNumber = Number(currentPost.Status);
    const fallbackStatus = Number.isFinite(currentStatusNumber)
      ? currentStatusNumber
      : 0;
    const resolvedStatus =
      typeof postData.status === "string"
        ? (() => {
            switch (postData.status.trim().toUpperCase()) {
              case "ACTIVE":
                return 0;
              case "BLOCKED":
                return 1;
              case "INACTIVE":
              case "DELETED":
                return 2;
              case "SOLD":
                return 3;
              default:
                return fallbackStatus;
            }
          })()
        : fallbackStatus;

    // Find category ID if category name provided
    let categoryId = currentPost.CategoryID;
    if (postData.category) {
      const categoriesResponse = await apiRequest<any[]>("/categories/All", {
        method: "GET",
      });
      const categories = categoriesResponse.success
        ? categoriesResponse.data || []
        : [];
      const category = categories.find(
        (cat: any) =>
          cat.CategoryName?.toLowerCase() ===
          (postData.category || "").toLowerCase(),
      );
      if (category) categoryId = category.CategoryID;
    }

    // Map frontend format to backend PostModel format
    // IMPORTANT: Preserve UserID from current post to prevent ownership changes
    const backendPost = {
      PostID: parseInt(postData.id),
      UserID: currentPost.UserID || currentPost.userID, // Preserve original owner
      CategoryID: categoryId,
      PostTitle: postData.title || currentPost.PostTitle || "",
      PostDescription: resolvedDescription,
      Price:
        postData.price !== undefined ? postData.price : currentPost.Price || 0,
      Status: resolvedStatus,
      CreatedAt:
        currentPost.CreatedAt ||
        currentPost.createdAt ||
        new Date().toISOString(),
      IsDeleted:
        currentPost.IsDeleted !== undefined ? currentPost.IsDeleted : false,
      City: resolvedCity,
      Area: resolvedArea,
    };

    const response = await apiRequest<any>(`/posts/${postData.id}`, {
      method: "PUT",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      // Update images if provided
      if (postData.images) {
        const sanitizedImages = postData.images
          .map((imageUrl) => imageUrl.trim())
          .filter((imageUrl) => imageUrl.length > 0);

        // Delete old images
        const allImages = await getAllPostImages();
        const postImages = allImages.filter(
          (img: any) => img.PostID?.toString() === postData.id,
        );

        for (const img of postImages) {
          await apiRequest(`/TbPostImages/${img.PostImageID}`, {
            method: "DELETE",
          });
        }

        // Add new images
        for (const imageUrl of sanitizedImages) {
          await apiRequest("/TbPostImages", {
            method: "POST",
            body: JSON.stringify({
              PostID: parseInt(postData.id),
              PostImageURL: imageUrl,
              UploadedAt: new Date().toISOString(),
              IsDeleted: false,
            }),
          });
        }

        invalidatePostImagesCache();
      }

      const product = transformPostModelToProduct(
        response.data,
        postData.images
          ? postData.images
              .map((imageUrl) => imageUrl.trim())
              .filter((imageUrl) => imageUrl.length > 0)
          : [],
      );
      return {
        success: true,
        post: product,
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to update post",
    };
  },

  /**
   * Delete post
   */
  deletePost: async (
    id: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      debugLog("[deletePost] Attempting to delete post with ID:", id);

      // Use /posts/ route (matches backend UserPostsController route)
      const response = await apiRequest<any>(`/posts/${id}`, {
        method: "DELETE",
      });

      debugLog("[deletePost] Full response object:", response);
      debugLog("[deletePost] Response success:", response.success);
      if (!response.success) {
        debugLog("[deletePost] Response error:", response.error);
      } else {
        debugLog("[deletePost] Response data:", response.data);
      }

      // Backend returns Ok() with message (plain text), so success is true if status is 200
      // The apiRequest function handles plain text responses and sets success: true
      if (response.success) {
        debugLog("[deletePost] Delete successful!");
        invalidatePostImagesCache();
        return { success: true };
      }

      // Extract error message from response
      let errorMessage = "Failed to delete post";

      if (response.error) {
        errorMessage =
          response.error.message || `Error ${response.error.code || "unknown"}`;
      }

      debugError("[deletePost] Delete failed!");
      debugError("[deletePost] Error message:", errorMessage);
      debugError(
        "[deletePost] Full response JSON:",
        JSON.stringify(response, null, 2),
      );

      return { success: false, error: errorMessage };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the post";
      debugError("[deletePost] Exception caught:", error);
      debugError("[deletePost] Error details:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get posts by user ID
   */
  getUserPosts: async (userId: string): Promise<Product[]> => {
    const response = await apiRequest<any[]>(`/posts/user/${userId}`, {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const allImages = await getAllPostImages();
      const imagesByPostId = groupImagesByPostId(allImages);

      return response.data.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          imagesByPostId[post.PostID?.toString() || ""] || [],
          index,
        ),
      );
    }

    return [];
  },

  /**
   * Track post view (analytics)
   */
  trackView: async (postId: string): Promise<boolean> => {
    const response = await apiRequest(`/posts/${postId}/views`, { method: "POST" });
    return response.success;
  },

};

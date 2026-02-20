import {
  CreatePostRequest,
  PostResponse,
  UpdatePostRequest,
} from "../../../types/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { authApi } from "../auth";
import { apiRequest, debugError, debugWarn } from "../client";
import { toIsoStringOrNow } from "../shared";
import { transformPostModelToProduct } from "./mappers";
import { resolveStatusValue, toStatusNumber } from "./status";
import { RawPost } from "./types";
import {
  enrichPostsWithCategoryAndSeller,
  getPostImageRowsByPostId,
  invalidatePostImagesCache,
  POST_IMAGES_ENDPOINT,
  resolveCategoryId,
} from "./lookups";

const DEFAULT_CITY = "Jordan";

function sanitizeImageUrls(images: readonly string[] | undefined): string[] {
  if (!images || images.length === 0) {
    return [];
  }

  const deduplicatedImages: string[] = [];
  const seenImages = new Set<string>();
  images.forEach((imageUrl) => {
    const normalized = imageUrl.trim();
    if (normalized.length === 0 || seenImages.has(normalized)) {
      return;
    }

    deduplicatedImages.push(normalized);
    seenImages.add(normalized);
  });

  return deduplicatedImages;
}

function resolveCity(cityValue: unknown): string {
  if (typeof cityValue !== "string") {
    return DEFAULT_CITY;
  }

  const normalizedCity = cityValue.trim();
  return normalizedCity.length > 0 ? normalizedCity : DEFAULT_CITY;
}

function resolveArea(areaValue: unknown): string | null {
  if (typeof areaValue !== "string") {
    return null;
  }

  const normalizedArea = areaValue.trim();
  return normalizedArea.length > 0 ? normalizedArea : null;
}

function resolvePostOwnerId(post: RawPost): number | undefined {
  return toPositiveIntegerId(
    post.UserID ??
      post.userID ??
      post.UserId ??
      post.SellerID ??
      post.SellerId ??
      post.sellerId,
  );
}

async function resolveCurrentUserId(): Promise<number | undefined> {
  try {
    const currentUserResponse = await authApi.getCurrentUser();
    if (!currentUserResponse.success || !currentUserResponse.data) {
      return undefined;
    }

    const user = currentUserResponse.data as Record<string, unknown>;
    const userId = toPositiveIntegerId(
      user.Id ?? user.id ?? user.UserID ?? user.userID,
    );
    return userId;
  } catch (error) {
    debugError("[createPost] Error getting current user:", error);
    return undefined;
  }
}

async function createPostImages(
  postId: number,
  imageUrls: readonly string[],
): Promise<string[]> {
  if (imageUrls.length === 0) {
    return [];
  }

  const creationResults = await Promise.all(
    imageUrls.map(async (imageUrl, index) => {
      try {
        const imageResponse = await apiRequest<unknown>(POST_IMAGES_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            PostID: postId,
            PostImageURL: imageUrl,
            UploadedAt: new Date().toISOString(),
            IsDeleted: false,
          }),
        });

        if (imageResponse.success) {
          return true;
        }

        debugError(
          `[createPost] Failed to create image ${index + 1}:`,
          imageResponse.error?.message || "Unknown error",
        );
        return false;
      } catch (error) {
        debugError(
          `[createPost] Error creating image ${index + 1}:`,
          error,
        );
        return false;
      }
    }),
  );

  const savedImageUrls = imageUrls.filter((_, index) => creationResults[index]);

  if (savedImageUrls.length > 0) {
    invalidatePostImagesCache();
  }

  return savedImageUrls;
}

async function replacePostImages(
  postId: number,
  imageUrls: readonly string[],
): Promise<void> {
  const existingImages = await getPostImageRowsByPostId(String(postId), true);
  const existingImageIds = Array.from(
    new Set(
      existingImages
        .map((image) => toPositiveIntegerId(image.PostImageID))
        .filter((imageId): imageId is number => imageId !== undefined),
    ),
  );

  if (existingImageIds.length > 0) {
    await Promise.all(
      existingImageIds.map(async (imageId) => {
        const deleteResponse = await apiRequest(
          `${POST_IMAGES_ENDPOINT}/${imageId}`,
          {
            method: "DELETE",
          },
        );
        if (!deleteResponse.success) {
          debugWarn(
            `[updatePost] Failed to delete image ${imageId}:`,
            deleteResponse.error?.message || "Unknown error",
          );
        }
      }),
    );
  }

  if (imageUrls.length > 0) {
    await Promise.all(
      imageUrls.map(async (imageUrl) => {
        const createResponse = await apiRequest(POST_IMAGES_ENDPOINT, {
          method: "POST",
          body: JSON.stringify({
            PostID: postId,
            PostImageURL: imageUrl,
            UploadedAt: new Date().toISOString(),
            IsDeleted: false,
          }),
        });
        if (!createResponse.success) {
          debugWarn(
            "[updatePost] Failed to create updated post image:",
            createResponse.error?.message || "Unknown error",
          );
        }
      }),
    );
  }

  if (existingImageIds.length > 0 || imageUrls.length > 0) {
    invalidatePostImagesCache();
  }
}

export async function createPost(
  postData: CreatePostRequest,
): Promise<PostResponse> {
  const userId = await resolveCurrentUserId();

  if (!userId) {
    const errorMsg =
      "Cannot create post: User not authenticated. Please log in first.";
    debugError("[createPost]", errorMsg);
    return {
      success: false,
      message: errorMsg,
    };
  }

  const categoryId = await resolveCategoryId(postData.category);
  if (!categoryId) {
    const errorMsg =
      "Cannot create post: selected category is invalid or not available.";
    return {
      success: false,
      message: errorMsg,
    };
  }

  const resolvedCity = resolveCity(postData.location ?? postData.city);
  const resolvedArea = resolveArea(postData.area);
  const backendPost = {
    PostID: null,
    UserID: userId,
    CategoryID: categoryId,
    PostTitle: postData.title,
    PostDescription: postData.description || "",
    Price: postData.price,
    Status: 0,
    CreatedAt: new Date().toISOString(),
    IsDeleted: false,
    City: resolvedCity,
    Area: resolvedArea,
  };

  const response = await apiRequest<RawPost>("/posts", {
    method: "POST",
    body: JSON.stringify(backendPost),
  });

  if (response.success && response.data) {
    const postIdValue = response.data.PostID ?? response.data.postID ?? response.data.id;
    const postId = toPositiveIntegerId(postIdValue);
    if (!postId) {
      return {
        success: false,
        message: "Post created but response did not include a valid PostID.",
      };
    }

    const sanitizedImageUrls = sanitizeImageUrls(postData.images);
    const savedImageUrls = await createPostImages(postId, sanitizedImageUrls);

    const enrichedPost = await enrichPostsWithCategoryAndSeller([
      response.data,
    ]);
    const enrichedPostData = enrichedPost[0] || response.data;

    enrichedPostData.Location = resolvedCity;
    enrichedPostData.Area = resolvedArea;

    const product = transformPostModelToProduct(
      enrichedPostData,
      savedImageUrls.length > 0 ? savedImageUrls : sanitizedImageUrls,
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
}

export async function updatePost(
  postData: UpdatePostRequest,
): Promise<PostResponse> {
  const normalizedPostId = toPositiveIntegerId(postData.id);
  if (!normalizedPostId) {
    return { success: false, message: "Invalid post ID" };
  }

  const currentPostResponse = await apiRequest<RawPost>(
    `/posts/${normalizedPostId}`,
    {
      method: "GET",
    },
  );
  if (!currentPostResponse.success || !currentPostResponse.data) {
    return { success: false, message: "Post not found" };
  }

  const currentPost = currentPostResponse.data;
  const resolvedDescriptionRaw =
    postData.description !== undefined
      ? postData.description
      : currentPost.PostDescription;
  const resolvedDescription =
    typeof resolvedDescriptionRaw === "string" ? resolvedDescriptionRaw : "";
  const resolvedCity = resolveCity(
    postData.location ?? postData.city ?? currentPost.City,
  );
  const resolvedArea =
    postData.area !== undefined
      ? resolveArea(postData.area)
      : resolveArea(currentPost.Area);
  const fallbackStatus = toStatusNumber(currentPost.Status);
  const resolvedStatus = resolveStatusValue(postData.status, fallbackStatus);

  const fallbackCategoryId = toPositiveIntegerId(
    currentPost.CategoryID ?? currentPost.categoryID ?? currentPost.CategoryId,
  );
  const requestedCategoryId =
    postData.category !== undefined
      ? await resolveCategoryId(postData.category)
      : undefined;
  const categoryId = requestedCategoryId ?? fallbackCategoryId;

  if (!categoryId) {
    return {
      success: false,
      message: "Cannot update post: selected category is invalid or unavailable.",
    };
  }

  const userId = resolvePostOwnerId(currentPost);
  if (!userId) {
    return {
      success: false,
      message: "Cannot update post: post owner is invalid.",
    };
  }

  const postTitleRaw = postData.title ?? currentPost.PostTitle ?? "";
  const postTitle = typeof postTitleRaw === "string" ? postTitleRaw : "";
  const priceRaw =
    postData.price !== undefined ? postData.price : Number(currentPost.Price);
  const resolvedPrice =
    typeof priceRaw === "number" && Number.isFinite(priceRaw) ? priceRaw : 0;
  const createdAt = toIsoStringOrNow(currentPost.CreatedAt ?? currentPost.createdAt);

  const backendPost = {
    PostID: normalizedPostId,
    UserID: userId,
    CategoryID: categoryId,
    PostTitle: postTitle,
    PostDescription: resolvedDescription,
    Price: resolvedPrice,
    Status: resolvedStatus,
    CreatedAt: createdAt,
    IsDeleted: Boolean(currentPost.IsDeleted ?? false),
    City: resolvedCity,
    Area: resolvedArea,
  };

  const response = await apiRequest<RawPost>(`/posts/${normalizedPostId}`, {
    method: "PUT",
    body: JSON.stringify(backendPost),
  });

  if (response.success && response.data) {
    const sanitizedImages =
      postData.images !== undefined
        ? sanitizeImageUrls(postData.images)
        : undefined;
    if (sanitizedImages) {
      await replacePostImages(normalizedPostId, sanitizedImages);
    }

    const product = transformPostModelToProduct(
      response.data,
      sanitizedImages || [],
    );
    return {
      success: true,
      post: product,
    };
  }

  const errorMessage = !response.success
    ? response.error?.message || "Failed to update post"
    : "Failed to update post";

  return {
    success: false,
    message: errorMessage,
  };
}

export async function deletePost(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedPostId = toPositiveIntegerId(id);
  if (!normalizedPostId) {
    return { success: false, error: "Invalid post ID" };
  }

  try {
    const response = await apiRequest<unknown>(`/posts/${normalizedPostId}`, {
      method: "DELETE",
    });

    if (response.success) {
      invalidatePostImagesCache();
      return { success: true };
    }

    let errorMessage = "Failed to delete post";

    if (response.error) {
      errorMessage =
        response.error.message || `Error ${response.error.code || "unknown"}`;
    }

    return { success: false, error: errorMessage };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while deleting the post";
    debugError("[deletePost] Exception caught:", error);
    return { success: false, error: errorMessage };
  }
}

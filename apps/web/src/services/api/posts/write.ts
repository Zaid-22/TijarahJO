import {
  CreatePostRequest,
  PostResponse,
  UpdatePostRequest,
  UpdatePostStatusRequest,
} from "../../../types/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { apiRequest, debugError } from "../client";
import { parseRawPost } from "../schemas/postSchema";
import { toIsoStringOrNow } from "../shared";
import { transformPostModelToPost } from "./mappers";
import { resolveStatusValue, toStatusNumber } from "./status";
import {
  enrichPostsWithCategoryAndSeller,
  invalidatePostImagesCache,
  resolveAreaId,
  resolveCategoryId,
  resolveCityId,
} from "./lookups";
import {
  createPostImages,
  replacePostImages,
  resolveArea,
  resolveCity,
  resolveCurrentUserId,
  resolvePostOwnerId,
  sanitizeImageInputs,
} from "./writeHelpers";

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

  // Frontend locations might be strings (like 'Amman')
  // but backend needs integer IDs for Post creation
  const cityId = await resolveCityId(postData.location ?? postData.city);
  const areaId = cityId
    ? await resolveAreaId(cityId, postData.area)
    : undefined;

  // Keep string resolutions for enriching the local object
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
    CityId: cityId,
    AreaId: areaId,
  };

  const response = await apiRequest<unknown>("/posts", {
    method: "POST",
    body: JSON.stringify(backendPost),
  });

  const createdPost = response.success ? parseRawPost(response.data) : null;
  if (createdPost) {
    const postIdValue =
      createdPost.PostID ?? createdPost.postID ?? createdPost.id;
    const postId = toPositiveIntegerId(postIdValue);
    if (!postId) {
      return {
        success: false,
        message: "Post created but response did not include a valid PostID.",
      };
    }

    const sanitizedImageInputs = sanitizeImageInputs(postData.images);
    const fallbackImageUrls = sanitizedImageInputs.filter(
      (entry): entry is string => typeof entry === "string",
    );
    const savedImageUrls = await createPostImages(postId, sanitizedImageInputs);

    const enrichedPost = await enrichPostsWithCategoryAndSeller([createdPost]);
    const enrichedPostData = enrichedPost[0] || createdPost;

    enrichedPostData.Location = resolvedCity;
    enrichedPostData.Area = resolvedArea;

    const post = transformPostModelToPost(
      enrichedPostData,
      savedImageUrls.length > 0 ? savedImageUrls : fallbackImageUrls,
    );
    return {
      success: true,
      post: post,
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

  const currentPostResponse = await apiRequest<unknown>(
    `/posts/${normalizedPostId}`,
    {
      method: "GET",
    },
  );
  const currentPost = currentPostResponse.success
    ? parseRawPost(currentPostResponse.data)
    : null;
  if (!currentPost) {
    return { success: false, message: "Post not found" };
  }
  const resolvedDescriptionRaw =
    postData.description !== undefined
      ? postData.description
      : currentPost.PostDescription;
  const resolvedDescription =
    typeof resolvedDescriptionRaw === "string" ? resolvedDescriptionRaw : "";

  // Resolve CityId and AreaId for the backend request
  const fallbackCityIdRaw = currentPost.CityId ?? currentPost.cityId;
  const fallbackCityId =
    typeof fallbackCityIdRaw === "number" ? fallbackCityIdRaw : undefined;

  const requestedCityId =
    (postData.location ?? postData.city) !== undefined
      ? await resolveCityId(postData.location ?? postData.city)
      : undefined;

  const finalCityId = requestedCityId ?? fallbackCityId;

  const fallbackAreaIdRaw = currentPost.AreaId ?? currentPost.areaId;
  const fallbackAreaId =
    typeof fallbackAreaIdRaw === "number" ? fallbackAreaIdRaw : undefined;

  const requestedAreaId =
    postData.area !== undefined && finalCityId
      ? await resolveAreaId(finalCityId, postData.area)
      : undefined;

  const finalAreaId = requestedAreaId ?? fallbackAreaId;
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
      message:
        "Cannot update post: selected category is invalid or unavailable.",
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
  const createdAt = toIsoStringOrNow(
    currentPost.CreatedAt ?? currentPost.createdAt,
  );

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
    CityId: finalCityId,
    AreaId: finalAreaId,
  };

  const response = await apiRequest<unknown>(`/posts/${normalizedPostId}`, {
    method: "PUT",
    body: JSON.stringify(backendPost),
  });

  const updatedPost = response.success ? parseRawPost(response.data) : null;
  if (updatedPost) {
    const sanitizedImageInputs =
      postData.images !== undefined
        ? sanitizeImageInputs(postData.images)
        : undefined;
    const replacedImageUrls = sanitizedImageInputs
      ? await replacePostImages(normalizedPostId, sanitizedImageInputs)
      : undefined;

    const post = transformPostModelToPost(updatedPost, replacedImageUrls || []);
    return {
      success: true,
      post: post,
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

export async function updatePostStatus(
  postData: UpdatePostStatusRequest,
): Promise<PostResponse> {
  const normalizedPostId = toPositiveIntegerId(postData.id);
  if (!normalizedPostId) {
    return { success: false, message: "Invalid post ID" };
  }

  const response = await apiRequest<unknown>(
    `/posts/${normalizedPostId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ Status: postData.status || "ACTIVE" }),
    },
  );

  const updatedPost = response.success ? parseRawPost(response.data) : null;
  if (updatedPost) {
    const post = transformPostModelToPost(updatedPost, []);
    return {
      success: true,
      post: post,
    };
  }

  const errorMessage = !response.success
    ? response.error?.message || "Failed to update post status"
    : "Failed to update post status";

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

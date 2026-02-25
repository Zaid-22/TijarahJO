import { PostImageInput } from "../../../types/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { authApi } from "../auth";
import { apiRequest, debugError, debugWarn } from "../client";
import type { RawPost } from "./types";
import {
  getPostImageRowsByPostId,
  invalidatePostImagesCache,
  POST_IMAGES_ENDPOINT,
} from "./lookups";

const DEFAULT_CITY = "Jordan";
const POST_IMAGE_UPLOAD_ENDPOINT = `${POST_IMAGES_ENDPOINT}/upload`;

function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function extractUploadedImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const directUrl =
    record.url ?? record.Url ?? record.postImageURL ?? record.PostImageURL;
  if (typeof directUrl === "string" && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  const postImageRecord =
    record.postImage && typeof record.postImage === "object"
      ? (record.postImage as Record<string, unknown>)
      : record.PostImage && typeof record.PostImage === "object"
        ? (record.PostImage as Record<string, unknown>)
        : null;
  if (!postImageRecord) {
    return null;
  }

  const nestedUrl =
    postImageRecord.PostImageURL ?? postImageRecord.postImageURL;
  return typeof nestedUrl === "string" && nestedUrl.trim().length > 0
    ? nestedUrl.trim()
    : null;
}

export function sanitizeImageInputs(
  images: readonly PostImageInput[] | undefined,
): PostImageInput[] {
  if (!images || images.length === 0) {
    return [];
  }

  const normalizedInputs: PostImageInput[] = [];
  const seenUrls = new Set<string>();
  const seenFiles = new Set<string>();

  for (const input of images) {
    if (typeof input === "string") {
      const normalized = input.trim();
      if (normalized.length === 0 || seenUrls.has(normalized)) {
        continue;
      }
      seenUrls.add(normalized);
      normalizedInputs.push(normalized);
      continue;
    }

    if (isFileInput(input)) {
      const signature = `${input.name}|${input.size}|${input.lastModified}`;
      if (seenFiles.has(signature)) {
        continue;
      }

      seenFiles.add(signature);
      normalizedInputs.push(input);
    }
  }

  return normalizedInputs;
}

export function resolveCity(cityValue: unknown): string {
  if (typeof cityValue !== "string") {
    return DEFAULT_CITY;
  }

  const normalizedCity = cityValue.trim();
  return normalizedCity.length > 0 ? normalizedCity : DEFAULT_CITY;
}

export function resolveArea(areaValue: unknown): string | null {
  if (typeof areaValue !== "string") {
    return null;
  }

  const normalizedArea = areaValue.trim();
  return normalizedArea.length > 0 ? normalizedArea : null;
}

export function resolvePostOwnerId(post: RawPost): number | undefined {
  return toPositiveIntegerId(
    post.UserID ??
      post.userID ??
      post.UserId ??
      post.SellerID ??
      post.SellerId ??
      post.sellerId,
  );
}

export async function resolveCurrentUserId(): Promise<number | undefined> {
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

async function createPostImageFromUrl(
  postId: number,
  imageUrl: string,
): Promise<boolean> {
  const imageResponse = await apiRequest<unknown>(POST_IMAGES_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      PostID: postId,
      PostImageURL: imageUrl,
      UploadedAt: new Date().toISOString(),
      IsDeleted: false,
    }),
  });

  return imageResponse.success;
}

async function uploadPostImageFile(
  postId: number,
  imageFile: File,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("PostID", String(postId));
  formData.append("File", imageFile, imageFile.name);

  const uploadResponse = await apiRequest<unknown>(POST_IMAGE_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });
  if (!uploadResponse.success) {
    debugError(
      "[post-images.upload] failed:",
      uploadResponse.error?.message || "Unknown error",
    );
    return null;
  }

  return extractUploadedImageUrl(uploadResponse.data);
}

export async function createPostImages(
  postId: number,
  imageInputs: readonly PostImageInput[],
): Promise<string[]> {
  if (imageInputs.length === 0) {
    return [];
  }

  const savedImageUrls: string[] = [];
  for (const imageInput of imageInputs) {
    if (typeof imageInput === "string") {
      try {
        const persisted = await createPostImageFromUrl(postId, imageInput);
        if (persisted) {
          savedImageUrls.push(imageInput);
        } else {
          debugError("[createPost] Failed to persist image URL:", imageInput);
        }
      } catch (error) {
        debugError("[createPost] Error persisting image URL:", error);
      }
      continue;
    }

    try {
      const uploadedUrl = await uploadPostImageFile(postId, imageInput);
      if (uploadedUrl) {
        savedImageUrls.push(uploadedUrl);
      }
    } catch (error) {
      debugError("[createPost] Error uploading image file:", error);
    }
  }

  if (savedImageUrls.length > 0) {
    invalidatePostImagesCache();
  }

  return savedImageUrls;
}

export async function replacePostImages(
  postId: number,
  imageInputs: readonly PostImageInput[],
): Promise<string[]> {
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

  if (imageInputs.length === 0) {
    if (existingImageIds.length > 0) {
      invalidatePostImagesCache();
    }
    return [];
  }

  return createPostImages(postId, imageInputs);
}

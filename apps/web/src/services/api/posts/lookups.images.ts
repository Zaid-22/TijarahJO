import { apiRequest } from "../client";
import { RawPostImage } from "./types";

export const POST_IMAGES_ENDPOINT = "/post-images";

let postImageRowsByPostIdCache: Record<
  string,
  { rows: RawPostImage[]; updatedAt: number }
> = {};

// In-flight deduplication — when multiple callers request images for the same
// post before the first response arrives, they share one HTTP request.
const _postImagesInflight: Map<string, Promise<RawPostImage[]>> = new Map();

const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
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
  if (isDeletedImageFlag(imageRow?.IsDeleted ?? imageRow?.isDeleted)) {
    return "";
  }

  const imageUrlRaw = imageRow?.PostImageURL ?? imageRow?.postImageURL;
  if (typeof imageUrlRaw !== "string") {
    return "";
  }

  return imageUrlRaw.trim();
}

function extractPostImageThumbnailUrl(imageRow: RawPostImage): string {
  if (isDeletedImageFlag(imageRow?.IsDeleted ?? imageRow?.isDeleted)) {
    return "";
  }

  const thumbnailUrlRaw =
    imageRow?.ThumbnailPostImageURL ??
    imageRow?.thumbnailPostImageURL ??
    imageRow?.thumbnailPostImageUrl;

  if (typeof thumbnailUrlRaw === "string" && thumbnailUrlRaw.trim().length > 0) {
    return thumbnailUrlRaw.trim();
  }

  return extractPostImageUrl(imageRow);
}

function mapPostImageRowsToUrls(imageRows: RawPostImage[]): string[] {
  return imageRows
    .map((imageRow) => extractPostImageUrl(imageRow))
    .filter((imageUrl) => imageUrl.length > 0);
}

export function getPostImagePreviewUrl(imageRows: RawPostImage[]): string {
  for (const imageRow of imageRows) {
    const previewUrl = extractPostImageThumbnailUrl(imageRow);
    if (previewUrl.length > 0) {
      return previewUrl;
    }
  }

  return "";
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

  // Deduplicate: if another caller is already fetching images for this post, share the promise.
  let inflight = _postImagesInflight.get(normalizedPostId);
  if (!forceRefresh && inflight) {
    return inflight;
  }

  inflight = (async () => {
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

    return postImageRowsByPostIdCache[normalizedPostId]?.rows || [];
  })().finally(() => { _postImagesInflight.delete(normalizedPostId); });
  _postImagesInflight.set(normalizedPostId, inflight);

  return inflight;
}

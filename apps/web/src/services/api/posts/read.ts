import { Product } from "../../../types";
import { apiRequest } from "../client";
import { transformPostModelToProduct } from "./mappers";
import { RawPost } from "./types";
import {
  getPostImagesByPostId,
  enrichPostsWithCategoryAndSeller,
} from "./lookups";

function getPostId(post: RawPost): string {
  return String(post?.PostID ?? post?.postID ?? post?.id ?? "").trim();
}

function postHasEmbeddedImages(post: RawPost): boolean {
  const imageCandidates = Array.isArray(post?.Images)
    ? post.Images
    : Array.isArray(post?.images)
      ? post.images
      : [];
  const hasImageArrayEntry = imageCandidates.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (hasImageArrayEntry) {
    return true;
  }

  const singleImageCandidate =
    typeof post?.PostImageURL === "string"
      ? post.PostImageURL
      : typeof post?.postImageURL === "string"
        ? post.postImageURL
        : "";
  return singleImageCandidate.trim().length > 0;
}

export async function getPostById(id: string): Promise<Product | null> {
  const response = await apiRequest<RawPost>(`/posts/${id}`, {
    method: "GET",
  });

  if (response.success && response.data) {
    const postImages = await getPostImagesByPostId(id);

    const enrichedPost = await enrichPostsWithCategoryAndSeller([
      response.data,
    ]);
    const enrichedPostData = enrichedPost[0] || response.data;

    return transformPostModelToProduct(enrichedPostData, postImages);
  }

  return null;
}

export async function getPostsByUserId(userId: string): Promise<Product[]> {
  const response = await apiRequest<RawPost[]>(`/posts/user/${userId}`, {
    method: "GET",
  });

  if (response.success && response.data && Array.isArray(response.data)) {
    const missingImagePostIds = Array.from(
      new Set(
        response.data
          .filter((post) => !postHasEmbeddedImages(post))
          .map((post) => getPostId(post))
          .filter((postId) => postId.length > 0),
      ),
    );

    const imageEntries = await Promise.all(
      missingImagePostIds.map(async (postId) => {
        const images = await getPostImagesByPostId(postId);
        return [postId, images] as const;
      }),
    );
    const imagesByPostId = Object.fromEntries(imageEntries);

    return response.data.map((post, index) =>
      transformPostModelToProduct(
        post,
        imagesByPostId[getPostId(post)] || [],
        index,
      ),
    );
  }

  return [];
}

export async function trackPostView(postId: string): Promise<boolean> {
  const response = await apiRequest(`/posts/${postId}/views`, { method: "POST" });
  return response.success;
}

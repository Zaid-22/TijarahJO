import { Post } from "../../../types";
import { apiRequest } from "../client";
import { parseRawPost, parseRawPostsCollection } from "../schemas/postSchema";
import { transformPostModelToPost } from "./mappers";
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

export async function getPostById(id: string): Promise<Post | null> {
  const response = await apiRequest<unknown>(`/posts/${id}`, {
    method: "GET",
  });

  const parsedPost = response.success ? parseRawPost(response.data) : null;
  if (parsedPost) {
    const postImages = await getPostImagesByPostId(id);

    const enrichedPost = await enrichPostsWithCategoryAndSeller([
      parsedPost,
    ]);
    const enrichedPostData = enrichedPost[0] || parsedPost;

    return transformPostModelToPost(enrichedPostData, postImages);
  }

  return null;
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  const response = await apiRequest<unknown>(`/posts/user/${userId}`, {
    method: "GET",
  });

  const parsedPosts = response.success
    ? parseRawPostsCollection(response.data)
    : [];

  if (parsedPosts.length > 0) {
    const missingImagePostIds = Array.from(
      new Set(
        parsedPosts
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

    return parsedPosts.map((post, index) =>
      transformPostModelToPost(
        post,
        imagesByPostId[getPostId(post)] || [],
        index,
      ),
    );
  }

  if (response.success && Array.isArray(response.data)) {
    return [];
  }

  return [];
}

export async function trackPostView(postId: string): Promise<boolean> {
  const response = await apiRequest(`/posts/${postId}/views`, { method: "POST" });
  return response.success;
}

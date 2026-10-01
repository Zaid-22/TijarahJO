import { Post } from "../../../types";
import { apiRequest } from "../client";
import { parseRawPost } from "../schemas/postSchema";
import { sellersApi } from "../sellers";
import { transformPostModelToPost } from "./mappers";
import { RawPost } from "./types";
import {
  getPostImagesByPostId,
  enrichPostsWithCategoryAndSeller,
} from "./lookups";

function getPostId(post: RawPost): string {
  return String(post?.PostID ?? post?.postID ?? post?.id ?? "").trim();
}

export async function getPostById(id: string): Promise<Post | null> {
  const response = await apiRequest<unknown>(`/posts/${id}`, {
    method: "GET",
  });

  if (!response.success) {
    if (response.error.code === "HTTP_404") {
      return null;
    }

    throw new Error(response.error.message || "Failed to load post");
  }

  const parsedPost = parseRawPost(response.data);
  if (!parsedPost || !getPostId(parsedPost)) {
    throw new Error("Invalid post response");
  }

  const postImages = await getPostImagesByPostId(id);

  const enrichedPost = await enrichPostsWithCategoryAndSeller([
    parsedPost,
  ]);
  const enrichedPostData = enrichedPost[0] || parsedPost;

  return transformPostModelToPost(enrichedPostData, postImages);
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  // The seller-profile listing query is the canonical enriched user-posts
  // endpoint: it batches image data into every card. The legacy
  // `/posts/user/{id}` DTO has no image fields and would require an N+1 image
  // lookup to render the same result correctly.
  const response = await sellersApi.getSellerProfile(userId);
  if (!response?.success || !Array.isArray(response.posts)) {
    throw new Error("Invalid user posts response");
  }

  return response.posts
    .filter((post) => Boolean(String(post?.id || "").trim()))
    .map((post) => {
      const enrichedPost = post as Post & { thumbnailImage?: string };
      const images = Array.isArray(post.images)
        ? post.images.filter(
            (image): image is string =>
              typeof image === "string" && image.trim().length > 0,
          )
        : [];
      return {
        ...post,
        images,
        image:
          String(enrichedPost.thumbnailImage || "").trim() ||
          String(post.image || "").trim() ||
          images[0] ||
          "",
      };
    });
}

export async function trackPostView(postId: string): Promise<boolean> {
  const response = await apiRequest(`/posts/${postId}/views`, { method: "POST" });
  return response.success;
}

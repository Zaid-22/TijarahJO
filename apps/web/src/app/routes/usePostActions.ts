import { useCallback } from "react";
import { api } from "../../services/api";
import { Post, UserProfile } from "../../types";
import type { PostImageInput } from "../../types/api";
import {
  invalidateServerQueryTag,
  updateServerQueryData,
} from "../../shared/hooks/useServerQuery";
import { buildCreatePostPayload, CreatePostInput } from "./appRoutesUtils";

const POSTS_FEED_CACHE_KEY = "posts:feed";

export interface UpdatePostInput {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  location?: string;
  area?: string;
  status?: "ACTIVE" | "SOLD" | "DELETED";
  images?: PostImageInput[];
}

export interface UpdatePostStatusInput {
  id: string;
  status: "ACTIVE" | "SOLD" | "DELETED" | "BLOCKED" | "INACTIVE";
}

interface UsePostActionsParams {
  userProfile: UserProfile;
  fetchPostsFromBackend: () => Promise<void>;
}

export function usePostActions({
  userProfile,
  fetchPostsFromBackend,
}: UsePostActionsParams) {
  const mergePostIntoFeedCache = useCallback((nextPost: Post) => {
    updateServerQueryData<Post[]>(
      POSTS_FEED_CACHE_KEY,
      (currentPosts) => {
        if (!currentPosts || currentPosts.length === 0) {
          return currentPosts;
        }

        let foundMatch = false;
        const updatedPosts = currentPosts.map((currentPost) => {
          if (currentPost.id !== nextPost.id) {
            return currentPost;
          }

          foundMatch = true;
          return {
            ...currentPost,
            ...nextPost,
            images:
              nextPost.images && nextPost.images.length > 0
                ? nextPost.images
                : currentPost.images,
            image:
              nextPost.image ||
              nextPost.images?.[0] ||
              currentPost.image ||
              currentPost.images?.[0] ||
              "",
          };
        });

        return foundMatch ? updatedPosts : currentPosts;
      },
      {
        cancelInFlight: true,
        keepFreshWhenUndefined: true,
      },
    );
  }, []);

  const createPost = useCallback(
    async (post: CreatePostInput) => {
      const result = await api.posts.createPost(
        buildCreatePostPayload(post, userProfile),
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to create post");
      }

      if (result.post) {
        updateServerQueryData<Post[]>(
          POSTS_FEED_CACHE_KEY,
          (currentPosts) =>
            currentPosts ? [result.post!, ...currentPosts] : currentPosts,
          {
            cancelInFlight: true,
            keepFreshWhenUndefined: true,
          },
        );
      }

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
      return result;
    },
    [fetchPostsFromBackend, userProfile],
  );

  const updatePost = useCallback(
    async (updatedPost: UpdatePostInput) => {
      const response = await api.posts.updatePost({
        id: updatedPost.id,
        title: updatedPost.name,
        description: updatedPost.description,
        price: updatedPost.price,
        category: updatedPost.category,
        location: updatedPost.location,
        area: updatedPost.area,
        status: updatedPost.status,
        images: updatedPost.images || [],
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update post");
      }

      if (response.post) {
        mergePostIntoFeedCache({
          ...response.post,
          seller: response.post.seller || userProfile.name || "",
          sellerId: response.post.sellerId || userProfile.id || "",
          phone: response.post.phone || userProfile.phone || "",
          location: response.post.location || updatedPost.location || "",
          area:
            response.post.area !== undefined
              ? response.post.area
              : updatedPost.area,
          category: response.post.category || updatedPost.category,
          name: response.post.name || updatedPost.name,
          description:
            response.post.description !== undefined
              ? response.post.description
              : updatedPost.description,
          status: response.post.status || updatedPost.status || "ACTIVE",
        });
      }

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
      return response;
    },
    [fetchPostsFromBackend, mergePostIntoFeedCache, userProfile],
  );

  const updatePostStatus = useCallback(
    async (statusData: UpdatePostStatusInput) => {
      const response = await api.posts.updatePostStatus({
        id: statusData.id,
        status: statusData.status,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update post status");
      }

      if (response.post) {
        mergePostIntoFeedCache(response.post);
      }

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
    },
    [fetchPostsFromBackend, mergePostIntoFeedCache],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const response = await api.posts.deletePost(postId);
      if (!response.success) {
        throw new Error(response.error || "Failed to delete post");
      }

      updateServerQueryData<Post[]>(
        POSTS_FEED_CACHE_KEY,
        (currentPosts) =>
          currentPosts?.filter((currentPost) => currentPost.id !== postId),
        {
          cancelInFlight: true,
          keepFreshWhenUndefined: true,
        },
      );

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
    },
    [fetchPostsFromBackend],
  );

  return {
    createPost,
    updatePost,
    updatePostStatus,
    deletePost,
  };
}

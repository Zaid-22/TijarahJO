import { useCallback } from "react";
import { api } from "../../services/api";
import { Post, UserProfile } from "../../types";
import type { PostImageInput } from "../../types/api";
import {
  invalidateServerQueryTag,
  updateServerQueryData,
} from "../../shared/hooks/useServerQuery";
import { logger } from "../../shared/lib/logger";
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

export interface UpdatePostResult {
  post: Post;
  message?: string;
}

interface UsePostActionsParams {
  userProfile: UserProfile;
  fetchPostsFromBackend: () => Promise<void>;
}

function hasResolvedLabel(value: string | undefined): value is string {
  const normalized = String(value || "").trim();
  return normalized.length > 0 && normalized.toLowerCase() !== "unknown";
}

export function usePostActions({
  userProfile,
  fetchPostsFromBackend,
}: UsePostActionsParams) {
  const refreshPostsAfterMutation = useCallback(async () => {
    try {
      await fetchPostsFromBackend();
    } catch (error) {
      // The mutation already succeeded and the local cache is authoritative.
      // A follow-up refresh failure must not be reported as a mutation failure.
      logger.warn(
        "[usePostActions] Failed to refresh posts after mutation",
        error,
      );
    }
  }, [fetchPostsFromBackend]);

  const mergePostIntoFeedCache = useCallback((
    nextPost: Post,
    { statusOnly = false }: { statusOnly?: boolean } = {},
  ) => {
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
          if (statusOnly) {
            return {
              ...currentPost,
              status: nextPost.status ?? currentPost.status,
            };
          }

          return {
            ...currentPost,
            ...nextPost,
            images:
              nextPost.images === undefined
                ? currentPost.images
                : nextPost.images,
            image: nextPost.image,
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
      await refreshPostsAfterMutation();
      return result;
    },
    [refreshPostsAfterMutation, userProfile],
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
        images: updatedPost.images,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update post");
      }

      if (!response.post || !String(response.post.id || "").trim()) {
        throw new Error("Update succeeded but returned an invalid post");
      }

      const authoritativePost: Post = {
        ...response.post,
        seller: hasResolvedLabel(response.post.seller)
          ? response.post.seller
          : userProfile.name || "",
        sellerId: response.post.sellerId || userProfile.id || "",
        phone: response.post.phone || userProfile.phone || "",
        location: response.post.location || updatedPost.location || "",
        area:
          response.post.area !== undefined
            ? response.post.area
            : updatedPost.area,
        category: hasResolvedLabel(response.post.category)
          ? response.post.category
          : updatedPost.category,
        name: response.post.name || updatedPost.name,
        description:
          response.post.description !== undefined
            ? response.post.description
            : updatedPost.description,
        status: response.post.status || updatedPost.status || "ACTIVE",
      };

      mergePostIntoFeedCache(authoritativePost);

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await refreshPostsAfterMutation();
      return {
        post: authoritativePost,
        message: response.message,
      } satisfies UpdatePostResult;
    },
    [mergePostIntoFeedCache, refreshPostsAfterMutation, userProfile],
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
        mergePostIntoFeedCache(response.post, { statusOnly: true });
      }

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await refreshPostsAfterMutation();
    },
    [mergePostIntoFeedCache, refreshPostsAfterMutation],
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
      await refreshPostsAfterMutation();
    },
    [refreshPostsAfterMutation],
  );

  return {
    createPost,
    updatePost,
    updatePostStatus,
    deletePost,
  };
}

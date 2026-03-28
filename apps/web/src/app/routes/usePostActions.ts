import { useCallback } from "react";
import { api } from "../../services/api";
import { UserProfile } from "../../types";
import type { PostImageInput } from "../../types/api";
import { invalidateServerQueryTag } from "../../shared/hooks/useServerQuery";
import { buildCreatePostPayload, CreatePostInput } from "./appRoutesUtils";

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
  const createPost = useCallback(
    async (post: CreatePostInput) => {
      const result = await api.posts.createPost(
        buildCreatePostPayload(post, userProfile),
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to create post");
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

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
    },
    [fetchPostsFromBackend],
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

      invalidateServerQueryTag("marketplace-search", {
        cancelInFlight: true,
      });
      await fetchPostsFromBackend();
    },
    [fetchPostsFromBackend],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const response = await api.posts.deletePost(postId);
      if (!response.success) {
        throw new Error(response.error || "Failed to delete post");
      }

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

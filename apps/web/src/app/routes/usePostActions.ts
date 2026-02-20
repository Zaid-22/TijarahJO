import { useCallback } from "react";
import { api } from "../../services/api";
import { UserProfile } from "../../types";
import { buildCreatePostPayload, CreatePostInput } from "./appRoutesUtils";

export interface UpdateProductInput {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  status?: "ACTIVE" | "SOLD" | "DELETED";
  images?: string[];
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
    async (product: CreatePostInput) => {
      const result = await api.posts.createPost(
        buildCreatePostPayload(product, userProfile),
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to create post");
      }

      await fetchPostsFromBackend();
      return result;
    },
    [fetchPostsFromBackend, userProfile],
  );

  const updatePost = useCallback(
    async (updatedProduct: UpdateProductInput) => {
      const response = await api.posts.updatePost({
        id: updatedProduct.id,
        title: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category,
        status: updatedProduct.status,
        images: updatedProduct.images || [],
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update post");
      }

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

      await fetchPostsFromBackend();
    },
    [fetchPostsFromBackend],
  );

  return {
    createPost,
    updatePost,
    deletePost,
  };
}

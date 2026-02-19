import {
  CreatePostRequest,
  PostResponse,
  PostsListResponse,
  SearchRequest,
  UpdatePostRequest,
} from "../../types/api";
import { Product } from "../../types";
import { getPostsFromFeed } from "./posts/feed";
import {
  getPostById,
  getPostsByUserId,
  trackPostView,
} from "./posts/read";
import {
  createPost as createPostRequest,
  deletePost as deletePostRequest,
  updatePost as updatePostRequest,
} from "./posts/write";

export const postsApi = {
  getPosts: async (params?: SearchRequest): Promise<PostsListResponse> =>
    getPostsFromFeed(params),

  getPost: async (id: string): Promise<Product | null> => getPostById(id),

  createPost: async (postData: CreatePostRequest): Promise<PostResponse> =>
    createPostRequest(postData),

  updatePost: async (postData: UpdatePostRequest): Promise<PostResponse> =>
    updatePostRequest(postData),

  deletePost: async (
    id: string,
  ): Promise<{ success: boolean; error?: string }> => deletePostRequest(id),

  getUserPosts: async (userId: string): Promise<Product[]> =>
    getPostsByUserId(userId),

  trackView: async (postId: string): Promise<boolean> => trackPostView(postId),
};

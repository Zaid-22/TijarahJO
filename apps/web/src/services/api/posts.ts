import {
  CreatePostRequest,
  PostResponse,
  PostsListResponse,
  SearchRequest,
  UpdatePostRequest,
  UpdatePostStatusRequest,
} from "../../types/api";
import { Post } from "../../types";
import type { ApiRequestOptions } from "./client";
import { getPostsFromFeed } from "./posts/feed";
import { getPostById, getPostsByUserId, trackPostView } from "./posts/read";
import {
  createPost as createPostRequest,
  deletePost as deletePostRequest,
  updatePost as updatePostRequest,
  updatePostStatus as updatePostStatusRequest,
} from "./posts/write";

type PostQueryOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

export const postsApi = {
  getPosts: async (
    params?: SearchRequest,
    options: PostQueryOptions = {},
  ): Promise<PostsListResponse> => getPostsFromFeed(params, options),

  getPost: async (id: string): Promise<Post | null> => getPostById(id),

  createPost: async (postData: CreatePostRequest): Promise<PostResponse> =>
    createPostRequest(postData),

  updatePost: async (postData: UpdatePostRequest): Promise<PostResponse> =>
    updatePostRequest(postData),

  updatePostStatus: async (
    postData: UpdatePostStatusRequest,
  ): Promise<PostResponse> => updatePostStatusRequest(postData),

  deletePost: async (
    id: string,
  ): Promise<{ success: boolean; error?: string }> => deletePostRequest(id),

  getUserPosts: async (userId: string): Promise<Post[]> =>
    getPostsByUserId(userId),

  trackView: async (postId: string): Promise<boolean> => trackPostView(postId),
};

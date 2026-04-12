import { apiRequest } from "./client";
import { PostComment } from "../../types";
import { ApiResponse } from "../../types/api";
import {
  parseCommentListResponse,
  parsePostComment,
} from "./schemas/commentsSchema";

export interface CommentListResponse {
  comments: PostComment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const commentsApi = {
  /**
   * Get top-level comments for a post.
   */
  getComments: async (
    postId: string | number,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<CommentListResponse>> => {
    const response = await apiRequest<unknown>(
      `/posts/${postId}/comments?page=${page}&limit=${limit}`
    );

    if (!response.success) {
      return response;
    }

    const parsed = parseCommentListResponse(response.data);
    if (!parsed) {
      return {
        success: false,
        error: {
          code: "INVALID_COMMENT_LIST",
          message: "Invalid comments response",
        },
      };
    }

    return { success: true, data: parsed };
  },

  /**
   * Get replies for a parent comment.
   */
  getReplies: async (
    postId: string | number,
    commentId: string | number,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<CommentListResponse>> => {
    const response = await apiRequest<unknown>(
      `/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`
    );

    if (!response.success) {
      return response;
    }

    const parsed = parseCommentListResponse(response.data);
    if (!parsed) {
      return {
        success: false,
        error: {
          code: "INVALID_COMMENT_LIST",
          message: "Invalid replies response",
        },
      };
    }

    return { success: true, data: parsed };
  },

  /**
   * Add a new comment or reply.
   */
  addComment: async (
    postId: string | number,
    content: string,
    parentCommentId?: number | null
  ): Promise<ApiResponse<PostComment>> => {
    const response = await apiRequest<unknown>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        Content: content,
        ParentCommentId: parentCommentId,
      }),
    });

    if (!response.success) {
      return response;
    }

    const parsed = parsePostComment(response.data);
    if (!parsed) {
      return {
        success: false,
        error: {
          code: "INVALID_COMMENT",
          message: "Invalid comment response",
        },
      };
    }

    return { success: true, data: parsed };
  },

  /**
   * Update an existing comment.
   */
  updateComment: async (
    postId: string | number,
    commentId: string | number,
    content: string
  ): Promise<ApiResponse<PostComment>> => {
    const response = await apiRequest<unknown>(
      `/posts/${postId}/comments/${commentId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          Content: content,
        }),
      }
    );

    if (!response.success) {
      return response;
    }

    const parsed = parsePostComment(response.data);
    if (!parsed) {
      return {
        success: false,
        error: {
          code: "INVALID_COMMENT",
          message: "Invalid comment response",
        },
      };
    }

    return { success: true, data: parsed };
  },

  /**
   * Delete a comment.
   */
  deleteComment: async (
    postId: string | number,
    commentId: string | number
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(
      `/posts/${postId}/comments/${commentId}`,
      {
        method: "DELETE",
      }
    );
  },
};

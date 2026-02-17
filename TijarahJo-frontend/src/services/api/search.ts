import { PostsListResponse, SearchRequest } from "../../types/api";
import { apiRequest } from "./client";
import { transformPostModelToProduct } from "./posts";

export const searchApi = {
  search: async (params: SearchRequest): Promise<PostsListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.query?.trim()) {
      queryParams.set("query", params.query.trim());
    }
    if (params.category?.trim()) {
      queryParams.set("category", params.category.trim());
    }
    if (params.city?.trim()) {
      queryParams.set("city", params.city.trim());
    }
    if (typeof params.minPrice === "number") {
      queryParams.set("minPrice", String(params.minPrice));
    }
    if (typeof params.maxPrice === "number") {
      queryParams.set("maxPrice", String(params.maxPrice));
    }
    if (params.status) {
      queryParams.set("status", params.status);
    }
    if (params.sortBy) {
      queryParams.set("sortBy", params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.set("sortOrder", params.sortOrder);
    }

    queryParams.set("page", String(params.page && params.page > 0 ? params.page : 1));
    queryParams.set("limit", String(params.limit && params.limit > 0 ? params.limit : 20));

    const queryString = queryParams.toString();
    const response = await apiRequest<{
      success?: boolean;
      posts?: any[];
      pagination?: {
        currentPage?: number;
        totalPages?: number;
        totalPosts?: number;
        postsPerPage?: number;
      };
    }>(`/search${queryString ? `?${queryString}` : ""}`, { method: "GET" });

    if (response.success && response.data && Array.isArray(response.data.posts)) {
      const posts = response.data.posts.map((post, index) =>
        transformPostModelToProduct(post, post?.images || post?.Images || [], index),
      );

      return {
        success: true,
        posts,
        pagination: {
          currentPage: Number(response.data.pagination?.currentPage || params.page || 1),
          totalPages: Number(response.data.pagination?.totalPages || 0),
          totalPosts: Number(response.data.pagination?.totalPosts || posts.length),
          postsPerPage: Number(response.data.pagination?.postsPerPage || params.limit || 20),
        },
      };
    }

    const responseError = response.success ? undefined : response.error;

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: params.page && params.page > 0 ? params.page : 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: params.limit && params.limit > 0 ? params.limit : 20,
      },
      error: {
        message: responseError?.message || "Search request failed",
        code: responseError?.code,
      },
    };
  },
};

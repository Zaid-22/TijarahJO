import { PostsListResponse, SearchRequest } from "../../types/api";
import { apiRequest } from "./client";
import { transformPostModelToProduct } from "./posts/mappers";
import { RawPost } from "./posts/types";

interface PaginationPayload {
  currentPage?: unknown;
  totalPages?: unknown;
  totalPosts?: unknown;
  postsPerPage?: unknown;
}

interface SearchPayload {
  success?: unknown;
  posts?: RawPost[];
  pagination?: PaginationPayload;
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => String(image).trim())
    .filter((image) => image.length > 0);
}

export const searchApi = {
  search: async (params: SearchRequest): Promise<PostsListResponse> => {
    const requestedPage = toPositiveInteger(params.page, 1);
    const requestedLimit = toPositiveInteger(params.limit, 20);

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
    if (
      typeof params.minPrice === "number" &&
      Number.isFinite(params.minPrice) &&
      params.minPrice >= 0
    ) {
      queryParams.set("minPrice", String(params.minPrice));
    }
    if (
      typeof params.maxPrice === "number" &&
      Number.isFinite(params.maxPrice) &&
      params.maxPrice >= 0
    ) {
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

    queryParams.set("page", String(requestedPage));
    queryParams.set("limit", String(requestedLimit));

    const queryString = queryParams.toString();
    const response = await apiRequest<SearchPayload>(
      `/search${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );

    if (response.success && response.data && Array.isArray(response.data.posts)) {
      const posts = response.data.posts.map((post, index) =>
        transformPostModelToProduct(
          post,
          normalizeImages(post?.images ?? post?.Images),
          index,
        ),
      );
      const pagination = response.data.pagination;

      return {
        success: true,
        posts,
        pagination: {
          currentPage: toPositiveInteger(pagination?.currentPage, requestedPage),
          totalPages: toNonNegativeInteger(pagination?.totalPages, 0),
          totalPosts: toNonNegativeInteger(pagination?.totalPosts, posts.length),
          postsPerPage: toPositiveInteger(pagination?.postsPerPage, requestedLimit),
        },
      };
    }

    const responseError = response.success ? undefined : response.error;

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: requestedPage,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: requestedLimit,
      },
      error: {
        message: responseError?.message || "Search request failed",
        code: responseError?.code,
      },
    };
  },
};

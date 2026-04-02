import { PostsListResponse, SearchRequest } from "../../types/api";
import { ApiRequestOptions, apiRequest } from "./client";
import { transformPostModelToPost } from "./posts/mappers";
import { enrichPostsWithCategoryAndSeller } from "./posts/lookups";
import {
  parsePaginationPayload,
  parsePostsEnvelope,
} from "./schemas/postSchema";

type SearchApiOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
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
  search: async (
    params: SearchRequest,
    options: SearchApiOptions = {},
  ): Promise<PostsListResponse> => {
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
    const response = await apiRequest<unknown>(
      `/search${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
        signal: options.signal,
        throwOnAbort: options.throwOnAbort,
      },
    );

    const parsedPayload = response.success
      ? parsePostsEnvelope(response.data)
      : null;

    if (parsedPayload) {
      const enrichedPosts = await enrichPostsWithCategoryAndSeller(parsedPayload.posts);
      const posts = enrichedPosts.map((post, index) =>
        transformPostModelToPost(
          post,
          normalizeImages(post?.images ?? post?.Images),
          index,
        ),
      );

      return {
        success: true,
        posts,
        pagination: parsePaginationPayload(
          parsedPayload.pagination,
          requestedPage,
          requestedLimit,
          posts.length,
        ),
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

import {
  PostsListResponse,
  SearchRequest,
} from "../../../types/api";
import { ApiRequestOptions, apiRequest } from "../client";
import {
  parsePaginationPayload,
  parsePostsEnvelope,
} from "../schemas/postSchema";
import { transformPostModelToPost } from "./mappers";

const FEED_PAGE_SIZE = 500;

type FeedApiOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

async function fetchFeedPage(
  page: number,
  limit: number,
  options: FeedApiOptions = {},
) {
  const response = await apiRequest<unknown>(
    `/posts/feed?page=${page}&limit=${limit}&includeDeleted=false`,
    {
      method: "GET",
      signal: options.signal,
      throwOnAbort: options.throwOnAbort,
    },
  );

  if (!response.success) {
    return null;
  }

  const parsedPayload = parsePostsEnvelope(response.data);
  if (!parsedPayload) {
    return null;
  }

  const posts = parsedPayload.posts.map((post, index) =>
    transformPostModelToPost(
      post,
      Array.isArray(post?.images) ? post.images : [],
      index,
    ),
  );

  return {
    posts,
    pagination: parsePaginationPayload(
      parsedPayload.pagination,
      page,
      limit,
      posts.length,
    ),
  };
}

export async function getPostsFromFeed(
  params?: SearchRequest,
  options: FeedApiOptions = {},
): Promise<PostsListResponse> {
  const pageNumber =
    params?.page && Number.isFinite(params.page) && params.page > 0
      ? Math.floor(params.page)
      : 1;
  const rowsPerPage =
    params?.limit && Number.isFinite(params.limit) && params.limit > 0
      ? Math.min(FEED_PAGE_SIZE, Math.floor(params.limit))
      : 20;

  const pagedFeed = await fetchFeedPage(pageNumber, rowsPerPage, options);
  if (!pagedFeed) {
    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: pageNumber,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: rowsPerPage,
      },
      error: {
        message: "Failed to fetch posts feed page.",
        code: "FEED_PAGE_FAILED",
      },
    };
  }

  return {
    success: true,
    posts: pagedFeed.posts,
    pagination: pagedFeed.pagination,
  };
}

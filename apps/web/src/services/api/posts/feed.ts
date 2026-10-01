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
import {
  enrichPostsWithCategoryAndSeller,
} from "./lookups";

const FEED_PAGE_SIZE = 200;

type FeedApiOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

type FeedPageResult = 
  | { posts: PostsListResponse["posts"]; pagination: NonNullable<PostsListResponse["pagination"]> }
  | { error: { code?: string; message?: string } };

async function fetchFeedPage(
  page: number,
  limit: number,
  options: FeedApiOptions = {},
): Promise<FeedPageResult> {
  const response = await apiRequest<unknown>(
    `/posts/feed?page=${page}&limit=${limit}&includeDeleted=false`,
    {
      method: "GET",
      signal: options.signal,
      throwOnAbort: options.throwOnAbort,
    },
  );

  if (!response.success) {
    return { error: response.error };
  }

  const parsedPayload = parsePostsEnvelope(response.data);
  if (!parsedPayload) {
    return { error: { code: "PARSE_ERROR" } };
  }

  const enrichedPosts = await enrichPostsWithCategoryAndSeller(parsedPayload.posts);

  const posts = enrichedPosts.map((post, index) =>
    transformPostModelToPost(
      post,
      Array.isArray(post?.Images)
        ? post.Images.filter((image): image is string => typeof image === "string")
        : Array.isArray(post?.images)
          ? post.images.filter((image): image is string => typeof image === "string")
          : [],
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
      : FEED_PAGE_SIZE;

  const pagedFeed = await fetchFeedPage(pageNumber, rowsPerPage, options);
  if (!pagedFeed || !('posts' in pagedFeed)) {
    const errorCode = (pagedFeed as { error?: { code?: string } })?.error?.code;
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
        message: errorCode === "DATABASE_UNAVAILABLE" 
            ? "TijarahJo is currently undergoing maintenance (database unreachable). Please try again later."
            : "We're having trouble loading the marketplace feed right now. Please check your connection and refresh the page to try again.",
        code: errorCode === "DATABASE_UNAVAILABLE" 
            ? "DATABASE_UNAVAILABLE" 
            : "FEED_PAGE_FAILED",
      },
    };
  }

  return {
    success: true,
    posts: pagedFeed.posts,
    pagination: pagedFeed.pagination,
  };
}

import {
  PostsListResponse,
  SearchRequest,
} from "../../../types/api";
import { apiRequest } from "../client";
import { transformPostModelToProduct } from "./mappers";
import { RawPost } from "./types";

interface PaginationLike {
  currentPage?: unknown;
  totalPages?: unknown;
  totalPosts?: unknown;
  postsPerPage?: unknown;
}

interface FeedPayload {
  posts?: RawPost[];
  pagination?: PaginationLike;
}

const FEED_PAGE_SIZE = 500;

function normalizePagination(
  pagination: PaginationLike | undefined,
  fallbackPage: number,
  fallbackRowsPerPage: number,
  fallbackTotalPosts: number,
) {
  const currentPageValue = Number(pagination?.currentPage);
  const resolvedCurrentPage =
    Number.isFinite(currentPageValue) && currentPageValue > 0
      ? Math.floor(currentPageValue)
      : fallbackPage;

  const postsPerPageValue = Number(pagination?.postsPerPage);
  const resolvedRowsPerPage =
    Number.isFinite(postsPerPageValue) && postsPerPageValue > 0
      ? Math.floor(postsPerPageValue)
      : fallbackRowsPerPage;

  const totalPostsValue = Number(pagination?.totalPosts);
  const resolvedTotalPosts =
    Number.isFinite(totalPostsValue) && totalPostsValue >= 0
      ? Math.floor(totalPostsValue)
      : fallbackTotalPosts;

  const totalPagesValue = Number(pagination?.totalPages);
  const resolvedTotalPages =
    Number.isFinite(totalPagesValue) && totalPagesValue >= 0
      ? Math.floor(totalPagesValue)
      : resolvedTotalPosts > 0
        ? Math.ceil(resolvedTotalPosts / resolvedRowsPerPage)
        : 0;

  return {
    currentPage: resolvedCurrentPage,
    totalPages: resolvedTotalPages,
    totalPosts: resolvedTotalPosts,
    postsPerPage: resolvedRowsPerPage,
  };
}

async function fetchFeedPage(page: number, limit: number) {
  const response = await apiRequest<FeedPayload>(
    `/posts/feed?page=${page}&limit=${limit}&includeDeleted=false`,
    { method: "GET" },
  );

  if (
    !response.success ||
    !response.data ||
    !Array.isArray(response.data.posts)
  ) {
    return null;
  }

  const posts = response.data.posts.map((post, index) =>
    transformPostModelToProduct(
      post,
      Array.isArray(post?.images) ? post.images : [],
      index,
    ),
  );

  return {
    posts,
    pagination: normalizePagination(
      response.data.pagination,
      page,
      limit,
      posts.length,
    ),
  };
}

export async function getPostsFromFeed(
  params?: SearchRequest,
): Promise<PostsListResponse> {
  const pageNumber =
    params?.page && Number.isFinite(params.page) && params.page > 0
      ? Math.floor(params.page)
      : 1;
  const rowsPerPage =
    params?.limit && Number.isFinite(params.limit) && params.limit > 0
      ? Math.min(FEED_PAGE_SIZE, Math.floor(params.limit))
      : 20;

  const pagedFeed = await fetchFeedPage(pageNumber, rowsPerPage);
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

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
import { getPostImagesByPostId } from "./lookups";
import { RawPost } from "./types";

const FEED_PAGE_SIZE = 500;

type FeedApiOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

type FeedPageResult = 
  | { posts: PostsListResponse["posts"]; pagination: NonNullable<PostsListResponse["pagination"]> }
  | { error: { code?: string; message?: string } };

function getPostId(post: RawPost): string {
  return String(post?.PostID ?? post?.postID ?? post?.id ?? "").trim();
}

function postHasEmbeddedImages(post: RawPost): boolean {
  const imageCandidates = Array.isArray(post?.Images)
    ? post.Images
    : Array.isArray(post?.images)
      ? post.images
      : [];
  const hasImageArrayEntry = imageCandidates.some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (hasImageArrayEntry) {
    return true;
  }

  const singleImageCandidate =
    typeof post?.PostImageURL === "string"
      ? post.PostImageURL
      : typeof post?.postImageURL === "string"
        ? post.postImageURL
        : "";
  return singleImageCandidate.trim().length > 0;
}

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

  const missingImagePostIds = Array.from(
    new Set(
      parsedPayload.posts
        .filter((post) => !postHasEmbeddedImages(post))
        .map((post) => getPostId(post))
        .filter((postId) => postId.length > 0),
    ),
  );
  const imageEntries = await Promise.all(
    missingImagePostIds.map(async (postId) => {
      const images = await getPostImagesByPostId(postId);
      return [postId, images] as const;
    }),
  );
  const imagesByPostId = Object.fromEntries(imageEntries);

  const posts = parsedPayload.posts.map((post, index) =>
    transformPostModelToPost(
      post,
      imagesByPostId[getPostId(post)] ||
        (Array.isArray(post?.Images)
          ? post.Images
          : Array.isArray(post?.images)
            ? post.images
            : []),
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
            : "Failed to fetch posts feed page.",
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

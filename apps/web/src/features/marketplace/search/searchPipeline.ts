import { Post } from "../../../types";

type SearchError = {
  message?: string;
};

type SearchResponse = {
  success: boolean;
  posts: Post[];
  error?: SearchError;
};

type SearchPipelineParams = {
  request: () => Promise<SearchResponse>;
  buildFallbackPosts: () => Post[];
  fallbackErrorMessage: string;
  transformRemotePosts?: (posts: Post[]) => Post[];
};

export type SearchPipelineResult = {
  posts: Post[];
  error: string | null;
};

function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function runSearchPipeline({
  request,
  buildFallbackPosts,
  fallbackErrorMessage,
  transformRemotePosts,
}: SearchPipelineParams): Promise<SearchPipelineResult> {
  try {
    const response = await request();
    if (response.success) {
      const posts = transformRemotePosts
        ? transformRemotePosts(response.posts)
        : response.posts;

      return {
        posts,
        error: null,
      };
    }

    const fallbackPosts = buildFallbackPosts();
    return {
      posts: fallbackPosts,
      error:
        fallbackPosts.length > 0
          ? null
          : response.error?.message || fallbackErrorMessage,
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    const fallbackPosts = buildFallbackPosts();
    return {
      posts: fallbackPosts,
      error:
        fallbackPosts.length > 0
          ? null
          : resolveErrorMessage(error, fallbackErrorMessage),
    };
  }
}

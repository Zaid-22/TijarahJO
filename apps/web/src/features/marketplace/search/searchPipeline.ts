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

function getPostIdentity(post: Post, index: number): string {
  const normalizedId = String(post.id || "").trim();
  if (normalizedId) {
    return `id:${normalizedId}`;
  }

  const normalizedName = String(post.name || "").trim().toLowerCase();
  const normalizedSellerId = String(post.sellerId || "")
    .trim()
    .toLowerCase();
  const normalizedCreatedAt = String(post.createdAt || "")
    .trim()
    .toLowerCase();

  return `fallback:${normalizedName}:${normalizedSellerId}:${normalizedCreatedAt}:${index}`;
}

function mergeSearchPosts(remotePosts: Post[], fallbackPosts: Post[]): Post[] {
  if (fallbackPosts.length === 0) {
    return remotePosts;
  }

  const mergedPosts = [...remotePosts];
  const seen = new Set(
    remotePosts.map((post, index) => getPostIdentity(post, index)),
  );

  fallbackPosts.forEach((post, index) => {
    const identity = getPostIdentity(post, index);
    if (seen.has(identity)) {
      return;
    }

    seen.add(identity);
    mergedPosts.push(post);
  });

  return mergedPosts;
}

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
      const remotePosts = transformRemotePosts
        ? transformRemotePosts(response.posts)
        : response.posts;
      const fallbackPosts = buildFallbackPosts();

      return {
        posts: mergeSearchPosts(remotePosts, fallbackPosts),
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

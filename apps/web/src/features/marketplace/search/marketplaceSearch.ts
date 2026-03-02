import { APP_CONFIG } from "../../../constants/appConfig";
import {
  isActivePost,
  rankPostsBySearch,
} from "../../../lib/searchRanking";
import { api } from "../../../services/api";
import { Post } from "../../../types";
import { runSearchPipeline, type SearchPipelineResult } from "./searchPipeline";

export type MarketplaceSearchPreset =
  | "home"
  | "all-posts"
  | "search-results";

interface MarketplaceSearchRequest {
  query: string;
  preset: MarketplaceSearchPreset;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "date" | "price" | "views";
  sortOrder?: "asc" | "desc";
  signal?: AbortSignal;
}

interface MarketplacePipelineRequest extends Omit<
  MarketplaceSearchRequest,
  "query"
> {
  query?: string;
}

interface RunMarketplaceSearchPipelineParams {
  request: MarketplacePipelineRequest;
  buildFallbackPosts: () => Post[];
  fallbackErrorMessage: string;
  transformRemotePosts?: (posts: Post[]) => Post[];
  signal?: AbortSignal;
}

function resolveLimit(preset: MarketplaceSearchPreset): number {
  switch (preset) {
    case "home":
      return APP_CONFIG.search.homeLimit;
    case "all-posts":
      return APP_CONFIG.search.allPostsLimit;
    case "search-results":
      return APP_CONFIG.search.searchResultsLimit;
    default:
      return APP_CONFIG.search.searchResultsLimit;
  }
}

function toSearchRequest({
  query,
  preset,
  page = 1,
  minPrice,
  maxPrice,
  sortBy = "date",
  sortOrder = "desc",
}: MarketplaceSearchRequest) {
  return {
    query,
    status: "ACTIVE" as const,
    page,
    limit: resolveLimit(preset),
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
  };
}

export async function runMarketplaceSearchPipeline({
  request,
  buildFallbackPosts,
  fallbackErrorMessage,
  transformRemotePosts,
  signal,
}: RunMarketplaceSearchPipelineParams): Promise<SearchPipelineResult> {
  const query = String(request.query || "").trim();

  return runSearchPipeline({
    request: () =>
      api.search.search(
        toSearchRequest({
          query,
          preset: request.preset,
          page: request.page,
          minPrice: request.minPrice,
          maxPrice: request.maxPrice,
          sortBy: request.sortBy,
          sortOrder: request.sortOrder,
        }),
        {
          signal,
          throwOnAbort: true,
        },
      ),
    buildFallbackPosts: () =>
      buildFallbackPosts().filter(isActivePost),
    fallbackErrorMessage,
    transformRemotePosts: (posts) => {
      const activePosts = posts.filter(isActivePost);
      return transformRemotePosts
        ? transformRemotePosts(activePosts)
        : activePosts;
    },
  });
}

export function rankMarketplacePosts(
  posts: Post[],
  query: string,
): Post[] {
  return rankPostsBySearch(posts.filter(isActivePost), query);
}

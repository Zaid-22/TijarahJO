import { APP_CONFIG } from "../../../constants/appConfig";
import {
  isActivePost,
} from "../../../lib/searchRanking";
import { api } from "../../../services/api";
import { Post } from "../../../types";
import { runSearchPipeline, type SearchPipelineResult } from "./searchPipeline";

export {
  filterAndSortMarketplacePosts,
  rankMarketplacePosts,
} from "./marketplacePostFiltering";

export type MarketplaceSearchPreset =
  | "home"
  | "all-posts"
  | "search-results";

interface MarketplaceSearchRequest {
  query: string;
  preset: MarketplaceSearchPreset;
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
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

export function resolveMarketplaceSearchLimit(
  preset: MarketplaceSearchPreset,
): number {
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
  limit,
  category,
  city,
  minPrice,
  maxPrice,
  sortBy = "date",
  sortOrder = "desc",
}: MarketplaceSearchRequest) {
  return {
    query,
    category,
    city,
    status: "ACTIVE" as const,
    page,
    limit: limit ?? resolveMarketplaceSearchLimit(preset),
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
          limit: request.limit,
          category: request.category,
          city: request.city,
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

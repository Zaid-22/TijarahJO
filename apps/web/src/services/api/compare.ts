import { apiRequest } from "./client";

export interface ComparePostDTO {
  PostId: number;
  Name: string;
  Price: number;
  Category: string;
  Description: string;
  ImageUrl: string | null;
  City: string;
  Views: number;
}

export interface PostFeaturesDTO {
  PostName: string;
  Features: string[];
}

export interface PostProsConsDTO {
  PostName: string;
  Pros: string[];
  Cons: string[];
}

export interface PostSummaryDTO {
  PostName: string;
  Summary: string;
}

export interface BestForDTO {
  Budget: string;
  Performance: string;
  DailyUse: string;
}

export interface FinalRecommendationDTO {
  WinnerName: string;
  BestFor: string;
  Reason: string;
}

export interface CompareResponse {
  Posts: ComparePostDTO[];
  PriceComparison: string;
  PostSummaries: PostSummaryDTO[];
  FeatureDifferences: PostFeaturesDTO[];
  ProsCons: PostProsConsDTO[];
  BestFor: BestForDTO | null;
  FinalRecommendation: FinalRecommendationDTO | null;
}

export interface CompareVideoPostInput {
  postId: number;
}

export interface CompareVideoRecommendation {
  PostId: number;
  VideoId: string;
  Title: string;
  ChannelTitle: string;
  ThumbnailUrl: string;
  ViewCount: number;
  PublishedAt: string;
  SearchQuery: string;
}

export interface CompareVideoRecommendationsResponse {
  IsConfigured: boolean;
  Message?: string | null;
  Videos: CompareVideoRecommendation[];
}

async function comparePosts(postIds: number[], language: string = "en"): Promise<CompareResponse | null> {
  const response = await apiRequest<CompareResponse>("/compare", {
    method: "POST",
    body: JSON.stringify({ PostIds: postIds, Language: language }),
    timeoutMs: 60_000, // Increase timeout to 60s for AI generation
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(
    response.error?.message ?? "Failed to compare posts"
  );
}

async function getVideoRecommendations(
  posts: CompareVideoPostInput[],
  language: string = "en",
): Promise<CompareVideoRecommendationsResponse> {
  const response = await apiRequest<CompareVideoRecommendationsResponse>("/compare/videos", {
    method: "POST",
    body: JSON.stringify({
      PostIds: posts.map((post) => post.postId),
      Language: language,
    }),
    timeoutMs: 20_000,
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(response.error?.message ?? "Failed to fetch recommended videos");
}

export const compareApi = {
  comparePosts,
  getVideoRecommendations,
};

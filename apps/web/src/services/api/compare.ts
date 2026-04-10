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

export const compareApi = {
  comparePosts,
};

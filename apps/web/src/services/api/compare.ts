import { apiRequest } from "./client";

export interface CompareProductDTO {
  ProductId: number;
  Name: string;
  Price: number;
  Category: string;
  Description: string;
  ImageUrl: string | null;
  City: string;
  Views: number;
}

export interface ProductFeaturesDTO {
  ProductName: string;
  Features: string[];
}

export interface ProductProsConsDTO {
  ProductName: string;
  Pros: string[];
  Cons: string[];
}

export interface BestForDTO {
  Budget: string;
  Performance: string;
  DailyUse: string;
}

export interface CompareResponse {
  Products: CompareProductDTO[];
  PriceComparison: string;
  FeatureDifferences: ProductFeaturesDTO[];
  ProsCons: ProductProsConsDTO[];
  BestFor: BestForDTO | null;
  FinalRecommendation: string;
}

async function compareProducts(productIds: number[]): Promise<CompareResponse | null> {
  const response = await apiRequest<CompareResponse>("/compare", {
    method: "POST",
    body: JSON.stringify({ ProductIds: productIds }),
    timeoutMs: 60_000, // Increase timeout to 60s for AI generation
  });

  if (response.success) {
    return response.data;
  }

  throw new Error(
    response.error?.message ?? "Failed to compare products"
  );
}

export const compareApi = {
  compareProducts,
};

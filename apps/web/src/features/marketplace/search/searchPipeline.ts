import { Product } from "../../../types";

type SearchError = {
  message?: string;
};

type SearchResponse = {
  success: boolean;
  posts: Product[];
  error?: SearchError;
};

type SearchPipelineParams = {
  request: () => Promise<SearchResponse>;
  buildFallbackProducts: () => Product[];
  fallbackErrorMessage: string;
  transformRemoteProducts?: (products: Product[]) => Product[];
};

export type SearchPipelineResult = {
  products: Product[];
  error: string | null;
};

function resolveErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

export async function runSearchPipeline({
  request,
  buildFallbackProducts,
  fallbackErrorMessage,
  transformRemoteProducts,
}: SearchPipelineParams): Promise<SearchPipelineResult> {
  try {
    const response = await request();
    if (response.success) {
      const products = transformRemoteProducts
        ? transformRemoteProducts(response.posts)
        : response.posts;

      return {
        products,
        error: null,
      };
    }

    const fallbackProducts = buildFallbackProducts();
    return {
      products: fallbackProducts,
      error:
        fallbackProducts.length > 0
          ? null
          : response.error?.message || fallbackErrorMessage,
    };
  } catch (error) {
    const fallbackProducts = buildFallbackProducts();
    return {
      products: fallbackProducts,
      error:
        fallbackProducts.length > 0
          ? null
          : resolveErrorMessage(error, fallbackErrorMessage),
    };
  }
}

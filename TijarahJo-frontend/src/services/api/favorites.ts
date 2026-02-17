import { apiRequest } from "./client";

export const favoritesApi = {
  getFavorites: async (): Promise<string[]> => {
    const response = await apiRequest<{
      success?: boolean;
      favorites?: Array<string | number>;
    }>("/favorites", {
      method: "GET",
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to load favorites");
    }

    if (
      response.data &&
      response.data.success === true &&
      Array.isArray(response.data.favorites)
    ) {
      return response.data.favorites
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);
    }

    throw new Error("Invalid favorites response");
  },

  addFavorite: async (postId: string): Promise<boolean> => {
    const normalizedPostId = String(postId).trim();
    if (!normalizedPostId) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean }>("/favorites", {
      method: "POST",
      body: JSON.stringify({ postId: normalizedPostId }),
    });

    return response.success && response.data?.success === true;
  },

  removeFavorite: async (postId: string): Promise<boolean> => {
    const normalizedPostId = String(postId).trim();
    if (!normalizedPostId) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean }>(
      `/favorites/${normalizedPostId}`,
      {
        method: "DELETE",
      },
    );

    return response.success && response.data?.success === true;
  },
};

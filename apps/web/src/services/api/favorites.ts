import { apiRequest } from "./client";

type FavoritesEnvelope = {
  success?: boolean;
  favorites?: Array<string | number>;
};

function normalizePostId(postId: unknown): string {
  return String(postId ?? "").trim();
}

function normalizeFavoritesPayload(payload: FavoritesEnvelope | undefined): string[] {
  if (!payload || payload.success !== true || !Array.isArray(payload.favorites)) {
    return [];
  }

  return Array.from(
    new Set(
      payload.favorites
        .map((value) => normalizePostId(value))
        .filter((value) => value.length > 0),
    ),
  );
}

async function mutateFavorite(
  method: "POST" | "DELETE",
  postId: string,
): Promise<boolean> {
  const normalizedPostId = normalizePostId(postId);
  if (!normalizedPostId) {
    return false;
  }

  const endpoint =
    method === "POST"
      ? "/favorites"
      : `/favorites/${encodeURIComponent(normalizedPostId)}`;

  const response = await apiRequest<{ success?: boolean }>(endpoint, {
    method,
    body: method === "POST" ? JSON.stringify({ postId: normalizedPostId }) : undefined,
  });

  return response.success && response.data?.success === true;
}

export const favoritesApi = {
  getFavorites: async (): Promise<string[]> => {
    const response = await apiRequest<FavoritesEnvelope>("/favorites", {
      method: "GET",
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to load favorites");
    }

    if (response.data?.success === true && Array.isArray(response.data.favorites)) {
      return normalizeFavoritesPayload(response.data);
    }

    throw new Error("Invalid favorites response");
  },

  addFavorite: async (postId: string): Promise<boolean> =>
    mutateFavorite("POST", postId),

  removeFavorite: async (postId: string): Promise<boolean> =>
    mutateFavorite("DELETE", postId),
};

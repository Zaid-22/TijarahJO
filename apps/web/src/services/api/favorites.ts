import { ApiRequestOptions, apiRequest } from "./client";
import {
  parseFavoriteMutationSuccess,
  parseFavoritesEnvelope,
} from "./schemas/favoritesSchema";

type FavoriteApiOptions = Pick<ApiRequestOptions, "signal" | "throwOnAbort">;

function normalizePostId(postId: unknown): string {
  return String(postId ?? "").trim();
}

async function mutateFavorite(
  method: "POST" | "DELETE",
  postId: string,
  options: FavoriteApiOptions = {},
): Promise<boolean> {
  const normalizedPostId = normalizePostId(postId);
  if (!normalizedPostId) {
    return false;
  }

  const endpoint =
    method === "POST"
      ? "/favorites"
      : `/favorites/${encodeURIComponent(normalizedPostId)}`;

  const response = await apiRequest<unknown>(endpoint, {
    method,
    body: method === "POST" ? JSON.stringify({ postId: normalizedPostId }) : undefined,
    signal: options.signal,
    throwOnAbort: options.throwOnAbort,
  });

  return response.success && parseFavoriteMutationSuccess(response.data);
}

export const favoritesApi = {
  getFavorites: async (options: FavoriteApiOptions = {}): Promise<string[]> => {
    const response = await apiRequest<unknown>("/favorites", {
      method: "GET",
      signal: options.signal,
      throwOnAbort: options.throwOnAbort,
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to load favorites");
    }

    const parsedPayload = parseFavoritesEnvelope(response.data);
    if (parsedPayload?.success === true) {
      return parsedPayload.favorites;
    }

    throw new Error("Invalid favorites response");
  },

  addFavorite: async (
    postId: string,
    options: FavoriteApiOptions = {},
  ): Promise<boolean> =>
    mutateFavorite("POST", postId, options),

  removeFavorite: async (
    postId: string,
    options: FavoriteApiOptions = {},
  ): Promise<boolean> =>
    mutateFavorite("DELETE", postId, options),
};

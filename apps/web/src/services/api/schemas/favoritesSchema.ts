import { asRecord } from "../normalizers";

type ParsedFavoritesEnvelope = {
  success: boolean;
  favorites: string[];
};

function normalizePostId(postId: unknown): string {
  return String(postId ?? "").trim();
}

export function parseFavoritesEnvelope(
  payload: unknown,
): ParsedFavoritesEnvelope | null {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const success = record.success === true;
  const rawFavorites = Array.isArray(record.favorites) ? record.favorites : [];

  return {
    success,
    favorites: Array.from(
      new Set(
        rawFavorites
          .map((value) => normalizePostId(value))
          .filter((value) => value.length > 0),
      ),
    ),
  };
}

export function parseFavoriteMutationSuccess(payload: unknown): boolean {
  const record = asRecord(payload);
  if (!record) {
    return false;
  }

  return record.success === true;
}

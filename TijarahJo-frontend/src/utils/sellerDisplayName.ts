export function normalizeSellerDisplayName(
  rawName: unknown,
  fallbackUserId?: string,
): string {
  const trimmedName = String(rawName || "").trim();
  const fallback = fallbackUserId ? `User ${fallbackUserId}` : "Unknown Seller";

  if (!trimmedName) {
    return fallback;
  }
  return trimmedName;
}

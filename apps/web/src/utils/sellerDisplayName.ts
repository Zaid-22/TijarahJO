const GENERIC_NAME_PATTERN = /^(user\s*\d*|unknown(\s+seller)?)$/i;

function isGenericPlaceholder(name: string): boolean {
  return GENERIC_NAME_PATTERN.test(name);
}

export function normalizeSellerDisplayName(
  rawName: unknown,
  fallbackUserId?: string,
): string {
  const trimmedName = String(rawName || "").trim();

  if (!trimmedName || isGenericPlaceholder(trimmedName)) {
    // Return a clean fallback — prefer a simple "Seller" label
    // over technical placeholders like "User 42"
    return fallbackUserId ? `Seller #${fallbackUserId}` : "Seller";
  }
  return trimmedName;
}

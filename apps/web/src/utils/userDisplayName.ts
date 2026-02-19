function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toFallbackLabel(fallbackUserId?: string | number): string {
  const normalizedId =
    fallbackUserId === undefined || fallbackUserId === null
      ? ""
      : String(fallbackUserId).trim();

  return normalizedId.length > 0 ? `User ${normalizedId}` : "Unknown";
}

export function resolveUserDisplayName(
  userData: Record<string, unknown> | null | undefined,
  fallbackUserId?: string | number,
): string {
  if (!userData) {
    return toFallbackLabel(fallbackUserId);
  }

  const explicitName =
    normalizeString(userData.name) || normalizeString(userData.Name);
  if (explicitName) {
    return explicitName;
  }

  const firstName =
    normalizeString(userData.firstName) || normalizeString(userData.FirstName);
  const lastName =
    normalizeString(userData.lastName) || normalizeString(userData.LastName);
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email = normalizeString(userData.email) || normalizeString(userData.Email);
  if (email) {
    return email;
  }

  return toFallbackLabel(fallbackUserId);
}

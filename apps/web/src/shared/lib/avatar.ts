import { APP_CONFIG } from "../../constants/appConfig";

/**
 * Resolve a real avatar URL from whatever the backend provides.
 * Returns `null` when no custom avatar exists so callers can
 * fall back to a first-letter initial instead of an SVG placeholder.
 */
export function resolveAvatarSrc(avatar?: string | null): string | null {
  const trimmed = typeof avatar === "string" ? avatar.trim() : "";
  if (!trimmed) {
    return null;
  }

  // Treat default-avatar paths as "no avatar" so the initial-letter
  // fallback shows instead of a generic silhouette.
  if (trimmed.startsWith("default-avatar") || trimmed === "/default-avatar.svg") {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return `${APP_CONFIG.backendHostUrl}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    const backendHost = APP_CONFIG.backendHostUrl.endsWith("/")
      ? APP_CONFIG.backendHostUrl.slice(0, -1)
      : APP_CONFIG.backendHostUrl;
    return `${backendHost}/${trimmed}`;
  }

  return trimmed;
}

/** Extract the first character of a name for use as an avatar initial. */
export function getAvatarInitial(name?: string | null): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

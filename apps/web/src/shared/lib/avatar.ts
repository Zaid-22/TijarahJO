import { APP_CONFIG } from "../../constants/appConfig";

export function resolveAvatarSrc(avatar?: string | null): string | null {
  const trimmed = typeof avatar === "string" ? avatar.trim() : "";
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${APP_CONFIG.backendHostUrl}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    const backendHost = APP_CONFIG.backendHostUrl.endsWith("/")
      ? APP_CONFIG.backendHostUrl.slice(0, -1)
      : APP_CONFIG.backendHostUrl;
    return `${backendHost}/${trimmed}`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}

/** Extract the first character of a name for use as an avatar initial. */
export function getAvatarInitial(name?: string | null): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

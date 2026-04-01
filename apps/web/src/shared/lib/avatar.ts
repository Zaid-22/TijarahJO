export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";

export function resolveAvatarSrc(avatar?: string | null): string {
  const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : "";
  return normalizedAvatar || DEFAULT_AVATAR_SRC;
}

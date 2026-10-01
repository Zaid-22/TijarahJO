import type { Message } from "../../types";

export function isChatMessageForParticipants(
  message: Pick<Message, "senderId" | "receiverId">,
  currentUserId: number | null | undefined,
  otherUserId: number | null | undefined,
): boolean {
  if (!currentUserId || !otherUserId) {
    return false;
  }

  return (
    (message.senderId === otherUserId && message.receiverId === currentUserId) ||
    (message.receiverId === otherUserId && message.senderId === currentUserId)
  );
}

export function isOwnedChatScope(
  currentUserId: string | null | undefined,
  loadedUserId: string | null | undefined,
): boolean {
  const normalizedCurrentUserId = String(currentUserId || "").trim();
  return (
    !!normalizedCurrentUserId &&
    normalizedCurrentUserId === String(loadedUserId || "").trim()
  );
}

import { Message } from "../../types";
import { toPositiveIntegerId } from "../../utils/idValidation";

export type RawChatMessage = {
  MessageId?: unknown;
  messageId?: unknown;
  SenderId?: unknown;
  senderId?: unknown;
  ReceiverId?: unknown;
  receiverId?: unknown;
  ConversationId?: unknown;
  conversationId?: unknown;
  PostId?: unknown;
  postId?: unknown;
  Content?: unknown;
  content?: unknown;
  Timestamp?: unknown;
  timestamp?: unknown;
  IsRead?: unknown;
  isRead?: unknown;
};

function toTimestampOrNow(value: unknown): string {
  const parsedTimestamp = value ? new Date(String(value)) : null;
  return parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
    ? parsedTimestamp.toISOString()
    : new Date().toISOString();
}

export function normalizeChatMessage(
  message: RawChatMessage | null | undefined,
): Message | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const senderId = toPositiveIntegerId(message.SenderId ?? message.senderId);
  const receiverId = toPositiveIntegerId(message.ReceiverId ?? message.receiverId);
  if (!senderId || !receiverId) {
    return null;
  }

  const content = String(message.Content ?? message.content ?? "").trim();
  if (!content) {
    return null;
  }

  const messageId = toPositiveIntegerId(message.MessageId ?? message.messageId);
  const postId = toPositiveIntegerId(message.PostId ?? message.postId);
  const conversationId = toPositiveIntegerId(
    message.ConversationId ?? message.conversationId,
  );
  const rawTimestamp = message.Timestamp ?? message.timestamp;

  return {
    senderId,
    receiverId,
    ...(messageId ? { messageId } : {}),
    ...(conversationId ? { conversationId } : {}),
    ...(postId ? { postId } : {}),
    content,
    timestamp: toTimestampOrNow(rawTimestamp),
    isRead: Boolean(message.IsRead ?? message.isRead ?? false),
  };
}

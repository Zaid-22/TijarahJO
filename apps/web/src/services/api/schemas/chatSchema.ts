import { asRecord } from "../normalizers";
import type { RawChatMessage } from "../chatNormalization";

type PresencePayload = {
  isOnline?: unknown;
  IsOnline?: unknown;
  lastSeenAtUtc?: unknown;
  LastSeenAtUtc?: unknown;
  statusText?: unknown;
  StatusText?: unknown;
};

function parseRawChatMessage(value: unknown): RawChatMessage | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const hasMessageIdentity =
    record.MessageId !== undefined ||
    record.messageId !== undefined ||
    record.SenderId !== undefined ||
    record.senderId !== undefined ||
    record.ReceiverId !== undefined ||
    record.receiverId !== undefined ||
    record.Content !== undefined ||
    record.content !== undefined;
  if (!hasMessageIdentity) {
    return null;
  }

  return {
    MessageId: record.MessageId,
    messageId: record.messageId,
    SenderId: record.SenderId,
    senderId: record.senderId,
    ReceiverId: record.ReceiverId,
    receiverId: record.receiverId,
    ConversationId: record.ConversationId,
    conversationId: record.conversationId,
    PostId: record.PostId,
    postId: record.postId,
    Content: record.Content,
    content: record.content,
    Timestamp: record.Timestamp,
    timestamp: record.timestamp,
    IsRead: record.IsRead,
    isRead: record.isRead,
  };
}

function parseRawChatMessagesCollection(
  value: unknown,
): RawChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parseRawChatMessage(entry))
    .filter((entry): entry is RawChatMessage => entry !== null);
}

function unwrapChatMessagesPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return value;
  }

  return record.messages ?? record.Messages ?? record.data ?? record.Data;
}

export function parseChatMessagesPayload(value: unknown): RawChatMessage[] {
  return parseRawChatMessagesCollection(unwrapChatMessagesPayload(value));
}

export function parseSentChatMessagePayload(
  value: unknown,
): RawChatMessage | null {
  if (Array.isArray(value)) {
    return parseRawChatMessagesCollection(value)[0] ?? null;
  }

  const directMessage = parseRawChatMessage(value);
  if (directMessage) {
    return directMessage;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const candidate =
    record.message ?? record.Message ?? record.data ?? record.Data;

  return parseRawChatMessage(candidate);
}

export function parsePresencePayload(value: unknown): PresencePayload | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const nestedPresence = asRecord(
    record.presence ?? record.Presence ?? record.data,
  );
  const source = nestedPresence ?? record;

  return {
    isOnline: source.isOnline,
    IsOnline: source.IsOnline,
    lastSeenAtUtc: source.lastSeenAtUtc,
    LastSeenAtUtc: source.LastSeenAtUtc,
    statusText: source.statusText,
    StatusText: source.StatusText,
  };
}

export function normalizePresenceTimestamp(value: unknown): string | undefined {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }

  const parsedDate = new Date(String(value));
  return Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate.toISOString();
}

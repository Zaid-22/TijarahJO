import { ChatPresence, Message } from "../../types";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";
import { normalizeChatMessage, RawChatMessage } from "./chatNormalization";
import {
  parseChatMessagesPayload,
  normalizePresenceTimestamp,
  parsePresencePayload,
  parseSentChatMessagePayload,
} from "./schemas/chatSchema";

const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CHAT_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

function normalizeChatUserId(userId: unknown): number | undefined {
  return toPositiveIntegerId(userId);
}

function normalizeMessageContent(content: unknown): string {
  return typeof content === "string" ? content.trim() : "";
}

function mapChatMessages(payload: RawChatMessage[]): Message[] {
  return payload
    .map((message) => normalizeChatMessage(message))
    .filter((message): message is Message => message !== null);
}

async function fetchChatMessages(endpoint: string): Promise<Message[]> {
  const response = await apiRequest<unknown>(endpoint, {
    method: "GET",
  });
  if (!response.success) {
    return [];
  }

  return mapChatMessages(parseChatMessagesPayload(response.data));
}

export const chatApi = {
  getRecentChats: async (): Promise<Message[]> => fetchChatMessages("/chat/recent"),

  getChatHistory: async (otherUserId: number): Promise<Message[]> => {
    const normalizedOtherUserId = normalizeChatUserId(otherUserId);
    if (!normalizedOtherUserId) {
      return [];
    }

    return fetchChatMessages(`/chat/history/${normalizedOtherUserId}`);
  },

  getPresence: async (otherUserId: number): Promise<ChatPresence> => {
    const normalizedOtherUserId = normalizeChatUserId(otherUserId);
    if (!normalizedOtherUserId) {
      return {
        isOnline: false,
      };
    }

    const response = await apiRequest<unknown>(
      `/chat/presence/${normalizedOtherUserId}`,
      {
        method: "GET",
      },
    );

    if (!response.success) {
      return {
        isOnline: false,
      };
    }

    const presence = parsePresencePayload(response.data);
    if (!presence) {
      return {
        isOnline: false,
      };
    }

    const isOnline = Boolean(
      presence.isOnline ??
        presence.IsOnline ??
        false,
    );
    const rawLastSeen = presence.lastSeenAtUtc ?? presence.LastSeenAtUtc;

    return {
      isOnline,
      lastSeenAtUtc: normalizePresenceTimestamp(rawLastSeen),
      statusText: String(
        presence.statusText ?? presence.StatusText ?? "",
      ).trim() || undefined,
    };
  },

  sendMessage: async (
    receiverId: number,
    content: string,
    postId?: number,
  ): Promise<Message | null> => {
    const normalizedReceiverId = normalizeChatUserId(receiverId);
    if (!normalizedReceiverId) {
      return null;
    }

    const trimmedContent = normalizeMessageContent(content);
    if (!trimmedContent) {
      return null;
    }

    const normalizedPostId = postId ? Number(postId) : null;

    const response = await apiRequest<unknown>("/chat/send", {
      method: "POST",
      body: JSON.stringify({
        ReceiverId: normalizedReceiverId,
        Content: trimmedContent,
        PostId: normalizedPostId ?? null,
      }),
    });

    if (response.success) {
      const message = parseSentChatMessagePayload(response.data);
      return message ? normalizeChatMessage(message) : null;
    }

    return null;
  },

  sendImageMessage: async (
    file: File,
    receiverId: number,
    caption?: string,
    postId?: number,
  ): Promise<Message> => {
    if (!(file instanceof File) || file.size <= 0) {
      throw new Error("Please choose a valid image file.");
    }

    const fileName = file.name.trim().toLowerCase();
    const extensionIndex = fileName.lastIndexOf(".");
    const extension =
      extensionIndex >= 0 ? fileName.slice(extensionIndex) : "";
    if (!ALLOWED_CHAT_IMAGE_EXTENSIONS.has(extension)) {
      throw new Error(
        "Unsupported image format. Use JPG, JPEG, PNG, WEBP, or GIF.",
      );
    }

    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      throw new Error("Image file exceeds the 10 MB size limit.");
    }

    const normalizedReceiverId = normalizeChatUserId(receiverId);
    if (!normalizedReceiverId) {
      throw new Error("A valid receiver is required.");
    }

    const normalizedPostId =
      postId === undefined ? undefined : normalizeChatUserId(postId);

    const formData = new FormData();
    formData.append("File", file);
    formData.append("ReceiverId", String(normalizedReceiverId));
    if (normalizedPostId) {
      formData.append("PostId", String(normalizedPostId));
    }
    const normalizedCaption = caption?.trim();
    if (normalizedCaption) {
      formData.append("Caption", normalizedCaption);
    }

    const response = await apiRequest<unknown>("/chat/send-image", {
      method: "POST",
      body: formData,
      timeoutMs: 60000,
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to upload image.");
    }

    const messagePayload = parseSentChatMessagePayload(response.data);
    const message = messagePayload
      ? normalizeChatMessage(messagePayload)
      : null;
    if (!message) {
      throw new Error("Image send failed because the server returned no message.");
    }

    return message;
  },
};

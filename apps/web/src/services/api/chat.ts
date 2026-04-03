import { ChatPresence, Message } from "../../types";
import { ChatImageUploadResponse } from "../../types/api";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";
import { normalizeChatMessage, RawChatMessage } from "./chatNormalization";
import {
  parseChatMessagesPayload,
  normalizePresenceTimestamp,
  parsePresencePayload,
  parseSentChatMessagePayload,
} from "./schemas/chatSchema";

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

  uploadImage: async (
    file: File,
    receiverId: number,
    postId?: number,
  ): Promise<string | null> => {
    if (!(file instanceof File) || file.size <= 0) {
      return null;
    }

    const normalizedReceiverId = normalizeChatUserId(receiverId);
    if (!normalizedReceiverId) {
      return null;
    }

    const normalizedPostId =
      postId === undefined ? undefined : normalizeChatUserId(postId);

    const formData = new FormData();
    formData.append("File", file);
    formData.append("ReceiverId", String(normalizedReceiverId));
    if (normalizedPostId) {
      formData.append("PostId", String(normalizedPostId));
    }

    const response = await apiRequest<ChatImageUploadResponse>("/chat/upload-image", {
      method: "POST",
      body: formData,
      timeoutMs: 60000, // 60 seconds
    });

    if (response.success && response.data) {
      return response.data.url || response.data.Url || null;
    }

    return null;
  },
};

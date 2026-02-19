import { Message } from "../../types";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";
import { normalizeChatMessage, RawChatMessage } from "./chatNormalization";

type PresencePayload = {
  isOnline?: unknown;
  IsOnline?: unknown;
};

function normalizeChatUserId(userId: unknown): number | undefined {
  return toPositiveIntegerId(userId);
}

function normalizeMessageContent(content: unknown): string {
  return typeof content === "string" ? content.trim() : "";
}

function mapChatMessages(payload: RawChatMessage[] | undefined): Message[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((message) => normalizeChatMessage(message))
    .filter((message): message is Message => message !== null);
}

async function fetchChatMessages(endpoint: string): Promise<Message[]> {
  const response = await apiRequest<RawChatMessage[]>(endpoint, {
    method: "GET",
  });
  if (!response.success) {
    return [];
  }

  return mapChatMessages(response.data);
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

  getPresence: async (otherUserId: number): Promise<boolean> => {
    const normalizedOtherUserId = normalizeChatUserId(otherUserId);
    if (!normalizedOtherUserId) {
      return false;
    }

    const response = await apiRequest<PresencePayload>(
      `/chat/presence/${normalizedOtherUserId}`,
      {
        method: "GET",
      },
    );

    if (!response.success || !response.data) {
      return false;
    }

    return Boolean(
      response.data.isOnline ??
        response.data.IsOnline ??
        false,
    );
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

    const normalizedPostId =
      postId === undefined ? undefined : normalizeChatUserId(postId);

    const response = await apiRequest<RawChatMessage>("/chat/send", {
      method: "POST",
      body: JSON.stringify({
        ReceiverId: normalizedReceiverId,
        Content: trimmedContent,
        PostId: normalizedPostId ?? null,
      }),
    });

    if (response.success && response.data) {
      return normalizeChatMessage(response.data);
    }

    return null;
  },
};

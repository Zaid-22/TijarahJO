import { Message } from "../../types";
import { apiRequest } from "./client";

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMessage(message: any): Message {
  const rawTimestamp = message?.Timestamp ?? message?.timestamp;
  const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : null;

  return {
    messageId: toNumber(message?.MessageId ?? message?.messageId, 0) || undefined,
    senderId: toNumber(message?.SenderId ?? message?.senderId),
    receiverId: toNumber(message?.ReceiverId ?? message?.receiverId),
    postId:
      message?.PostId !== null && message?.PostId !== undefined
        ? toNumber(message?.PostId, 0) || undefined
        : message?.postId !== null && message?.postId !== undefined
          ? toNumber(message?.postId, 0) || undefined
          : undefined,
    content: String(message?.Content ?? message?.content ?? ""),
    timestamp:
      parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
        ? parsedTimestamp.toISOString()
        : new Date().toISOString(),
    isRead: Boolean(message?.IsRead ?? message?.isRead ?? false),
  };
}

export const chatApi = {
  getRecentChats: async (): Promise<Message[]> => {
    const response = await apiRequest<any[]>("/chat/recent", {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data.map(normalizeMessage);
    }

    return [];
  },

  getChatHistory: async (otherUserId: number): Promise<Message[]> => {
    const response = await apiRequest<any[]>(`/chat/history/${otherUserId}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data.map(normalizeMessage);
    }

    return [];
  },

  getPresence: async (otherUserId: number): Promise<boolean> => {
    const response = await apiRequest<any>(`/chat/presence/${otherUserId}`, {
      method: "GET",
    });

    if (!response.success || !response.data) {
      return false;
    }

    return Boolean(
      (response.data as any).isOnline ??
        (response.data as any).IsOnline ??
        false,
    );
  },

  sendMessage: async (
    receiverId: number,
    content: string,
    postId?: number,
  ): Promise<Message | null> => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return null;
    }

    const response = await apiRequest<any>("/chat/send", {
      method: "POST",
      body: JSON.stringify({
        ReceiverId: receiverId,
        Content: trimmedContent,
        PostId: postId ?? null,
      }),
    });

    if (response.success && response.data) {
      return normalizeMessage(response.data);
    }

    return null;
  },
};

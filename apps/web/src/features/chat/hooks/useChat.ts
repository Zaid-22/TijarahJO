import { useEffect, useState, useCallback } from "react";
import { chatService } from "../../../services/chatService";
import { Message } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { logger } from "../../../shared/lib/logger";
import { serializeChatImageMessage } from "../chatMessageContent";

function isSameChatMessage(left: Message, right: Message): boolean {
  if (
    left.messageId !== undefined &&
    right.messageId !== undefined &&
    left.messageId === right.messageId
  ) {
    return true;
  }

  return (
    left.senderId === right.senderId &&
    left.receiverId === right.receiverId &&
    (left.postId ?? undefined) === (right.postId ?? undefined) &&
    left.content === right.content &&
    left.timestamp === right.timestamp
  );
}

export function useChat(otherUserId?: number) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to SignalR
  useEffect(() => {
    if (!isAuthenticated) {
      chatService.disconnect().catch((disconnectError) => {
        logger.warn("[useChat] SignalR disconnect failed:", disconnectError);
      });
      setError(null);
      return;
    }

    const currentUserId = toPositiveIntegerId(user?.id);
    if (!currentUserId) {
      setError("Missing current user ID.");
      return;
    }

    chatService
      .connect(currentUserId)
      .then(() => {
        setError(null);
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : String(err || "Unknown error");
        logger.error("[useChat] SignalR connection failed:", err);
        setError("Connection failed: " + errorMessage);
      });

    return () => {
      // Keep connection alive for shared realtime usage across chat screens.
    };
  }, [isAuthenticated, user?.id]);

  // Listen for messages
  useEffect(() => {
    const currentUserId = toPositiveIntegerId(user?.id);

    const unsub = chatService.onMessageReceived((msg) => {
      if (
        otherUserId &&
        (msg.senderId === otherUserId || msg.receiverId === otherUserId)
      ) {
        setMessages((prev) => {
          if (prev.some((existingMessage) => isSameChatMessage(existingMessage, msg))) {
            return prev;
          }

          return [...prev, msg];
        });

        if (
          currentUserId &&
          msg.senderId === otherUserId &&
          msg.receiverId === currentUserId
        ) {
          void api.chat.getChatHistory(otherUserId).catch((refreshError) => {
            logger.warn("[useChat] Failed to refresh history for read receipt", refreshError);
          });
        }
      }
    });
    return unsub;
  }, [otherUserId, user?.id]);

  useEffect(() => {
    const currentUserId = toPositiveIntegerId(user?.id);
    if (!otherUserId || !currentUserId) {
      return;
    }

    const unsub = chatService.onMessagesRead((receipt) => {
      if (receipt.readerUserId !== otherUserId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) => {
          const belongsToConversation = message.conversationId === receipt.conversationId;

          if (
            message.senderId !== currentUserId ||
            !belongsToConversation ||
            message.isRead ||
            message.messageId === undefined ||
            message.messageId > receipt.lastReadMessageId
          ) {
            return message;
          }

          return {
            ...message,
            isRead: true,
          };
        }),
      );
    });

    return unsub;
  }, [otherUserId, user?.id]);

  // Fetch history
  const loadHistory = useCallback(async () => {
    if (!otherUserId || !isAuthenticated) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const history = await api.chat.getChatHistory(otherUserId);
      const sortedHistory = [...history].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      setMessages(sortedHistory);
      setError(null);
    } catch (err) {
      logger.warn("[useChat] Failed to load history", err);
      setError("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId, isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendMessage = async (content: string, postId?: number): Promise<boolean> => {
    if (!otherUserId) return false;
    const normalizedOtherUserId = toPositiveIntegerId(otherUserId);
    if (!normalizedOtherUserId) return false;

    const trimmedContent = content.trim();
    if (!trimmedContent) return false;
    const normalizedPostId =
      postId === undefined ? undefined : toPositiveIntegerId(postId);

    try {
      const sentMessage = await chatService.sendMessage(
        normalizedOtherUserId,
        trimmedContent,
        normalizedPostId,
      );
      if (sentMessage) {
        setMessages((prev) => {
          if (prev.some((existingMessage) => isSameChatMessage(existingMessage, sentMessage))) {
            return prev;
          }

          return [...prev, sentMessage];
        });
      }
      setError(null);
      return true;
    } catch (err) {
      logger.warn("[useChat] Failed to send message", err);
      const errStr = err instanceof Error ? err.message : "Failed to send message.";
      setError(errStr);
      return false;
    }
  };

  const sendImageMessage = async (
    file: File,
    caption?: string,
    postId?: number,
  ): Promise<boolean> => {
    if (!otherUserId) {
      return false;
    }

    try {
      const imageUrl = await api.chat.uploadImage(file, otherUserId, postId);
      return sendMessage(serializeChatImageMessage(imageUrl, caption), postId);
    } catch (err) {
      logger.warn("[useChat] Failed to upload image", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload image.";
      setError(errorMessage);
      return false;
    }
  };

  return { messages, isLoading, error, sendMessage, sendImageMessage };
}

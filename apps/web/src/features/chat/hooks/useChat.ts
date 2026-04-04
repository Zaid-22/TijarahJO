import { useEffect, useState, useCallback } from "react";
import { chatService } from "../../../services/chatService";
import { Message } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { logger } from "../../../shared/lib/logger";
import { serializeChatImageMessage } from "../chatMessageContent";

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
    const unsub = chatService.onMessageReceived((msg) => {
      if (
        otherUserId &&
        (msg.senderId === otherUserId || msg.receiverId === otherUserId)
      ) {
        setMessages((prev) => {
          // Deduplicate the sender's own optimistic messages
          const currentUserIdNum = toPositiveIntegerId(user?.id);
          if (currentUserIdNum && msg.senderId === currentUserIdNum) {
            const existingOptIdx = prev.findIndex(
              (m) => m.messageId === undefined && m.content === msg.content
            );
            if (existingOptIdx !== -1) {
              const newArr = [...prev];
              newArr[existingOptIdx] = msg;
              return newArr;
            }
          }
          // Default: check if we already have it to avoid extreme edge case dupes, otherwise append
          if (msg.messageId && prev.some((m) => m.messageId === msg.messageId)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
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
      setMessages((prev) => [...prev, sentMessage]);
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

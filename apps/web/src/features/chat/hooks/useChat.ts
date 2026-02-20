import { useEffect, useState, useCallback } from "react";
import { chatService } from "../../../services/chatService";
import { Message } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { logger } from "../../../shared/lib/logger";

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
        setMessages((prev) => [...prev, msg]);
      }
    });
    return unsub;
  }, [otherUserId]);

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

  const sendMessage = async (content: string, postId?: number) => {
    if (!otherUserId) return;
    const normalizedOtherUserId = toPositiveIntegerId(otherUserId);
    if (!normalizedOtherUserId) return;

    const trimmedContent = content.trim();
    if (!trimmedContent) return;
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
    } catch (err) {
      logger.warn("[useChat] Failed to send message", err);
      setError("Failed to send message.");
    }
  };

  return { messages, isLoading, error, sendMessage };
}

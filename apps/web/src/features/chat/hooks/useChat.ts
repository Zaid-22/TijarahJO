import { useEffect, useState, useCallback, useRef } from "react";
import { chatService } from "../../../services/chatService";
import { Message } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { logger } from "../../../shared/lib/logger";
import { isChatMessageForParticipants } from "../chatOwnership";

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
  const historyRunIdRef = useRef(0);

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
        isChatMessageForParticipants(msg, currentUserId, otherUserId)
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
    const runId = ++historyRunIdRef.current;
    const isCurrentRun = () => runId === historyRunIdRef.current;
    const currentUserId = toPositiveIntegerId(user?.id);

    if (!otherUserId || !isAuthenticated || !currentUserId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setMessages([]);
    setIsLoading(true);
    try {
      const history = await api.chat.getChatHistory(otherUserId);
      if (!isCurrentRun()) {
        return;
      }
      const sortedHistory = [...history].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      setMessages(sortedHistory);
      setError(null);
    } catch (err) {
      if (!isCurrentRun()) {
        return;
      }
      logger.warn("[useChat] Failed to load history", err);
      setError("Failed to load history");
    } finally {
      if (isCurrentRun()) {
        setIsLoading(false);
      }
    }
  }, [otherUserId, isAuthenticated, user?.id]);

  useEffect(() => {
    void loadHistory();
    return () => {
      historyRunIdRef.current += 1;
    };
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
      const sentMessage = await api.chat.sendImageMessage(
        file,
        otherUserId,
        caption,
        postId,
      );
      setMessages((prev) => {
        if (prev.some((existingMessage) => isSameChatMessage(existingMessage, sentMessage))) {
          return prev;
        }

        return [...prev, sentMessage];
      });
      setError(null);
      return true;
    } catch (err) {
      logger.warn("[useChat] Failed to send image", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send image.";
      setError(errorMessage);
      return false;
    }
  };

  return { messages, isLoading, error, sendMessage, sendImageMessage };
}

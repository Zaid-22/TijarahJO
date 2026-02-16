import { useEffect, useState, useCallback } from "react";
import { chatService } from "../services/chatService";
import { Message } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export function useChat(otherUserId?: number) {
  const { user, isAuthenticated, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to SignalR
  useEffect(() => {
    const authToken = token || localStorage.getItem("tijarahjo_token");
    if (!isAuthenticated || !authToken) {
      chatService.disconnect().catch((disconnectError) => {
        console.warn("[useChat] SignalR disconnect failed:", disconnectError);
      });
      setError(null);
      return;
    }

    chatService
      .connect(authToken)
      .then(() => {
        setError(null);
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : String(err || "Unknown error");
        console.error("[useChat] SignalR connection failed:", err);
        setError("Connection failed: " + errorMessage);
      });

    return () => {
      // Keep connection alive for shared realtime usage across chat screens.
    };
  }, [isAuthenticated, token]);

  // Listen for messages
  useEffect(() => {
    const unsub = chatService.onMessageReceived((msg) => {
      if (otherUserId && msg.senderId === otherUserId) {
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
      console.error(err);
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
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    try {
      await chatService.sendMessage(otherUserId, trimmedContent, postId);

      const newMsg: Message = {
        senderId: Number.parseInt(user?.id || "0", 10),
        receiverId: otherUserId,
        content: trimmedContent,
        postId,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, newMsg]);
      setError(null);
    } catch (err) {
      try {
        const fallbackMessage = await api.chat.sendMessage(
          otherUserId,
          trimmedContent,
          postId,
        );

        if (fallbackMessage) {
          setMessages((prev) => [...prev, fallbackMessage]);
          setError(null);
          return;
        }
      } catch (fallbackError) {
        console.error(fallbackError);
      }

      console.error(err);
      setError("Failed to send message.");
    }
  };

  return { messages, isLoading, error, sendMessage };
}

import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { chatService } from "../../services/chatService";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { resolveUserDisplayName } from "../../utils/userDisplayName";
import { logger } from "../../shared/lib/logger";
import { formatChatPreviewText } from "./chatMessageContent";
import type { ChatSummary } from "./chatSessionUtils";
import type { Language } from "../../types";

interface UseChatListOptions {
  isAuthenticated: boolean;
  userId: string | undefined;
  resolvedLanguage: Language;
  userPrefix: string;
  selectedUserId: number | null;
}

interface UseChatListResult {
  chats: ChatSummary[];
  isLoadingChats: boolean;
  userDisplayNamesById: Record<number, string>;
  userAvatarsById: Record<number, string | undefined>;
  setUserDisplayNamesById: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setUserAvatarsById: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
}

export function useChatList({
  isAuthenticated,
  userId,
  resolvedLanguage,
  userPrefix,
  selectedUserId,
}: UseChatListOptions): UseChatListResult {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [userDisplayNamesById, setUserDisplayNamesById] = useState<Record<number, string>>({});
  const [userAvatarsById, setUserAvatarsById] = useState<Record<number, string | undefined>>({});

  useEffect(() => {
    async function fetchChats() {
      if (!isAuthenticated || !userId) {
        setChats([]);
        setUserDisplayNamesById({});
        setIsLoadingChats(false);
        return;
      }

      setIsLoadingChats(true);
      try {
        const currentUserId = toPositiveIntegerId(userId);
        if (!currentUserId) {
          setChats([]);
          return;
        }

        const recentMessages = await api.chat.getRecentChats();
        const sorted = [...recentMessages].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const chatsByUser = new Map<number, ChatSummary>();
        sorted.forEach((message) => {
          const otherUser =
            message.senderId === currentUserId ? message.receiverId : message.senderId;

          if (!otherUser || otherUser === currentUserId || chatsByUser.has(otherUser)) {
            return;
          }

          chatsByUser.set(otherUser, {
            userId: otherUser,
            displayName: `${userPrefix} ${otherUser}`,
            lastMessage: formatChatPreviewText(message.content, resolvedLanguage),
            timestamp: message.timestamp,
            isRead: message.senderId === currentUserId ? true : Boolean(message.isRead),
          });
        });

        const otherUserIds = Array.from(chatsByUser.keys());
        const namesById: Record<number, string> = {};
        const avatarsById: Record<number, string | undefined> = {};

        await Promise.all(
          otherUserIds.map(async (id) => {
            const userData = await api.users.getUser(String(id));
            namesById[id] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              id,
            );
            if (userData?.avatar) avatarsById[id] = userData.avatar;
          }),
        );

        setUserDisplayNamesById(namesById);
        setUserAvatarsById(avatarsById);
        setChats(
          Array.from(chatsByUser.values()).map((chat) => ({
            ...chat,
            displayName: namesById[chat.userId] || chat.displayName,
            avatar: avatarsById[chat.userId],
          })),
        );
      } catch (error) {
        logger.warn("Failed to load chats", error);
        setChats([]);
        setUserDisplayNamesById({});
      } finally {
        setIsLoadingChats(false);
      }
    }

    fetchChats();
  }, [isAuthenticated, userId, resolvedLanguage, userPrefix]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const currentUserId = toPositiveIntegerId(userId);
    if (!currentUserId) return;

    return chatService.onMessageReceived((message) => {
      const otherUserId =
        message.senderId === currentUserId ? message.receiverId : message.senderId;
      if (!otherUserId || otherUserId === currentUserId) return;

      setChats((prevChats) => {
        const existing = prevChats.find((c) => c.userId === otherUserId);
        const updated: ChatSummary = {
          userId: otherUserId,
          displayName: existing?.displayName || `${userPrefix} ${otherUserId}`,
          avatar: existing?.avatar || userAvatarsById[otherUserId],
          lastMessage: formatChatPreviewText(message.content, resolvedLanguage),
          timestamp: message.timestamp,
          isRead: message.senderId === currentUserId || selectedUserId === otherUserId,
        };
        return [updated, ...prevChats.filter((c) => c.userId !== otherUserId)];
      });
    });
  }, [isAuthenticated, userId, userPrefix, selectedUserId, resolvedLanguage, userAvatarsById]);

  return {
    chats,
    isLoadingChats,
    userDisplayNamesById,
    userAvatarsById,
    setUserDisplayNamesById,
    setUserAvatarsById,
  };
}

import { useState, useEffect, useRef } from "react";
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
  /** IDs that useChatList has already fetched — shared with ChatPage to avoid duplicate requests. */
  fetchedIdsRef: React.RefObject<Set<number>>;
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

  // Track which user IDs we've already attempted to fetch so we never
  // re-fetch even if the map is updated from elsewhere (e.g. ChatPage effect).
  const fetchedIdsRef = useRef<Set<number>>(new Set());

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
            // Empty string — no placeholder flash. The ChatList component
            // should handle empty names gracefully (skeleton or hide).
            displayName: "",
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
            fetchedIdsRef.current.add(id);
            const userData = await api.users.getUser(String(id));
            namesById[id] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              id,
            );
            if (userData?.avatar) avatarsById[id] = userData.avatar;
          }),
        );

        // MERGE into existing maps — don't wipe names that ChatPage's effect
        // may have already resolved for the selected user.
        setUserDisplayNamesById((prev) => ({ ...prev, ...namesById }));
        setUserAvatarsById((prev) => ({ ...prev, ...avatarsById }));
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
        // Don't wipe userDisplayNamesById — keep any names already resolved.
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
          // Use existing name, or look up the cache, or leave empty while fetching.
          displayName: existing?.displayName || userDisplayNamesById[otherUserId] || "",
          avatar: existing?.avatar || userAvatarsById[otherUserId],
          lastMessage: formatChatPreviewText(message.content, resolvedLanguage),
          timestamp: message.timestamp,
          isRead: message.senderId === currentUserId || selectedUserId === otherUserId,
        };
        return [updated, ...prevChats.filter((c) => c.userId !== otherUserId)];
      });

      // If this is a brand-new user we haven't fetched yet, fetch their name.
      if (!fetchedIdsRef.current.has(otherUserId) && !userDisplayNamesById[otherUserId]) {
        fetchedIdsRef.current.add(otherUserId);
        (async () => {
          const userData = await api.users.getUser(String(otherUserId));
          const resolvedName = resolveUserDisplayName(
            userData as Record<string, unknown> | null | undefined,
            otherUserId,
          );
          setUserDisplayNamesById((prev) => ({ ...prev, [otherUserId]: resolvedName }));
          if (userData?.avatar) {
            setUserAvatarsById((prev) => ({ ...prev, [otherUserId]: userData.avatar }));
          }
          // Update the chat entry with the resolved name
          setChats((prev) =>
            prev.map((c) =>
              c.userId === otherUserId
                ? { ...c, displayName: resolvedName, avatar: userData?.avatar || c.avatar }
                : c,
            ),
          );
        })();
      }
    });
  }, [isAuthenticated, userId, userPrefix, selectedUserId, resolvedLanguage, userAvatarsById, userDisplayNamesById]);

  return {
    chats,
    isLoadingChats,
    userDisplayNamesById,
    userAvatarsById,
    setUserDisplayNamesById,
    setUserAvatarsById,
    fetchedIdsRef,
  };
}

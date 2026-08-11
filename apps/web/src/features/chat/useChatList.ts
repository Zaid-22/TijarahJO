import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { chatService } from "../../services/chatService";
import { toPositiveIntegerId } from "../../utils/idValidation";
import { resolveUserDisplayName } from "../../utils/userDisplayName";
import { logger } from "../../shared/lib/logger";
import { formatChatPreviewText } from "./chatMessageContent";
import type { ChatSummary } from "./chatSessionUtils";
import type { Language } from "../../types";
import { isOwnedChatScope } from "./chatOwnership";

// Module-level deduplication — prevents duplicate /users/{id} fetches when
// multiple components (chat list + chat page) resolve the same user simultaneously.
const _chatUserInflight: Map<number, ReturnType<typeof api.users.getUser>> = new Map();

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
  const [loadedUserId, setLoadedUserId] = useState("");
  const requestRunIdRef = useRef(0);

  // Track which user IDs we've already attempted to fetch so we never
  // re-fetch even if the map is updated from elsewhere (e.g. ChatPage effect).
  const fetchedIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const requestedUserId = isAuthenticated ? String(userId || "").trim() : "";
    const runId = ++requestRunIdRef.current;
    const isCurrentRequest = () => runId === requestRunIdRef.current;

    async function fetchChats() {
      setLoadedUserId("");
      setChats([]);
      setUserDisplayNamesById({});
      setUserAvatarsById({});
      fetchedIdsRef.current = new Set();

      if (!requestedUserId) {
        setChats([]);
        setUserDisplayNamesById({});
        setIsLoadingChats(false);
        return;
      }

      setIsLoadingChats(true);
      try {
        const currentUserId = toPositiveIntegerId(requestedUserId);
        if (!currentUserId) {
          setChats([]);
          return;
        }

        const recentMessages = await api.chat.getRecentChats();
        if (!isCurrentRequest()) {
          return;
        }
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
            // Deduplicate: share inflight request if ChatPage or another effect is
            // already fetching this same user, to avoid parallel /users/{id} bursts.
            let inflight = _chatUserInflight.get(id);
            if (!inflight) {
              inflight = api.users.getUser(String(id)).finally(() => _chatUserInflight.delete(id));
              _chatUserInflight.set(id, inflight);
            }
            const userData = await inflight;
            namesById[id] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              id,
            );
            if (userData?.avatar) avatarsById[id] = userData.avatar;
          }),
        );

        if (!isCurrentRequest()) {
          return;
        }

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
        if (isCurrentRequest()) {
          logger.warn("Failed to load chats", error);
          setChats([]);
        }
      } finally {
        if (isCurrentRequest()) {
          setLoadedUserId(requestedUserId);
          setIsLoadingChats(false);
        }
      }
    }

    void fetchChats();
    return () => {
      requestRunIdRef.current += 1;
    };
  }, [isAuthenticated, userId, resolvedLanguage, userPrefix]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const currentUserId = toPositiveIntegerId(userId);
    if (!currentUserId) return;
    let isActiveOwner = true;

    const unsubscribe = chatService.onMessageReceived((message) => {
      if (!isActiveOwner) {
        return;
      }
      const otherUserId =
        message.senderId === currentUserId ? message.receiverId : message.senderId;
      const belongsToCurrentUser =
        message.senderId === currentUserId || message.receiverId === currentUserId;
      if (!belongsToCurrentUser || !otherUserId || otherUserId === currentUserId) return;

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
          if (!isActiveOwner) {
            return;
          }
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

    return () => {
      isActiveOwner = false;
      unsubscribe();
    };
  }, [isAuthenticated, userId, userPrefix, selectedUserId, resolvedLanguage, userAvatarsById, userDisplayNamesById]);

  const currentOwnerId = isAuthenticated ? String(userId || "").trim() : "";
  const dataBelongsToCurrentUser =
    isAuthenticated && isOwnedChatScope(currentOwnerId, loadedUserId);

  return {
    chats: dataBelongsToCurrentUser ? chats : [],
    isLoadingChats:
      isAuthenticated && (isLoadingChats || !dataBelongsToCurrentUser),
    userDisplayNamesById: dataBelongsToCurrentUser ? userDisplayNamesById : {},
    userAvatarsById: dataBelongsToCurrentUser ? userAvatarsById : {},
    setUserDisplayNamesById,
    setUserAvatarsById,
    fetchedIdsRef,
  };
}

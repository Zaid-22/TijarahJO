import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ChatList } from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { resolveUserDisplayName } from "../../../utils/userDisplayName";
import { logger } from "../../../shared/lib/logger";
import { chatService } from "../../../services/chatService";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import type { Language } from "../../../types";
import { Button } from "../../../shared/ui/button";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { LoadingState } from "../../../shared/ui/loading-state";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import { formatChatPreviewText } from "../chatMessageContent";
import {
  buildCurrentPath,
  resolveBackPathFromHistoryState,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";

type ChatLocationState = {
  fromPath?: string;
  chatListPath?: string;
};

type PersistedChatReturnState = {
  chatUserId: string;
  returnPath: string;
};

function readPersistedChatReturnState(): PersistedChatReturnState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.sessionStorage.getItem("chat:return-path");
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as {
      chatUserId?: unknown;
      returnPath?: unknown;
    };

    return typeof parsedValue.chatUserId === "string" &&
      parsedValue.chatUserId.trim().length > 0 &&
      typeof parsedValue.returnPath === "string" &&
      parsedValue.returnPath.startsWith("/")
      ? {
          chatUserId: parsedValue.chatUserId,
          returnPath: parsedValue.returnPath,
        }
      : null;
  } catch {
    return null;
  }
}

function clearPersistedChatReturnPath() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem("chat:return-path");
}

interface ChatSummary {
  userId: number;
  displayName: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatPageProps {
  language?: Language;
}

export function ChatPage({ language }: ChatPageProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const resolvedLanguage = language || resolveDocumentLanguage();
  const isRTL = resolvedLanguage === "ar";
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const locationState =
    typeof location.state === "object" && location.state !== null
      ? (location.state as ChatLocationState)
      : null;
  const safeBackPath = resolveBackPathFromLocationState({
    locationState,
    currentPath,
    fallbackPath: "/",
  });
  const queryReturnPath = (() => {
    const rawValue = new URLSearchParams(location.search).get("returnTo");
    return typeof rawValue === "string" && rawValue.startsWith("/")
      ? rawValue
      : "/";
  })();
  const historyBackPath =
    typeof window === "undefined"
      ? "/"
      : resolveBackPathFromHistoryState({
          historyState: window.history.state,
          currentPath,
          fallbackPath: "/",
        });
  const routeSelectedUserId = toPositiveIntegerId(userId);
  const persistedReturnState = readPersistedChatReturnState();
  const persistedBackPath =
    routeSelectedUserId !== null &&
    persistedReturnState?.chatUserId === String(routeSelectedUserId)
      ? persistedReturnState.returnPath
      : null;
  const [sessionReturnState, setSessionReturnState] = useState<
    PersistedChatReturnState | null
  >(persistedReturnState);
  const rememberedBackPath =
    routeSelectedUserId !== null &&
    sessionReturnState?.chatUserId === String(routeSelectedUserId)
      ? sessionReturnState.returnPath
      : null;
  const resolvedBackPath =
    queryReturnPath !== "/"
      ? queryReturnPath
      : safeBackPath !== "/"
        ? safeBackPath
        : historyBackPath !== "/"
          ? historyBackPath
          : routeSelectedUserId !== null
            ? rememberedBackPath ?? persistedBackPath ?? safeBackPath
            : safeBackPath;
  const chatListPath =
    typeof locationState?.chatListPath === "string" &&
    locationState.chatListPath.startsWith("/")
      ? locationState.chatListPath
      : null;
  const labels = {
    userPrefix: resolvedLanguage === "ar" ? "مستخدم" : "User",
    me: resolvedLanguage === "ar" ? "أنا" : "Me",
    messages: resolvedLanguage === "ar" ? "الرسائل" : "Messages",
    pleaseLogin:
      resolvedLanguage === "ar"
        ? "يرجى تسجيل الدخول لعرض الرسائل."
        : "Please login to view your messages.",
    goHome: resolvedLanguage === "ar" ? "العودة للرئيسية" : "Go Home",
    selectConversation:
      resolvedLanguage === "ar"
        ? "اختر محادثة للبدء بالدردشة"
        : "Select a conversation to start chatting",
    back: resolvedLanguage === "ar" ? "العودة" : "Back",
  };

  const initialSelectedUserId = routeSelectedUserId;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialSelectedUserId ?? null,
  );
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>();
  const [userDisplayNamesById, setUserDisplayNamesById] = useState<
    Record<number, string>
  >({});
  const [userAvatarsById, setUserAvatarsById] = useState<
    Record<number, string | undefined>
  >({});
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    async function fetchChats() {
      if (!isAuthenticated || !user?.id) {
        setChats([]);
        setUserDisplayNamesById({});
        setIsLoadingChats(false);
        return;
      }

      setIsLoadingChats(true);
      try {
        const currentUserId = toPositiveIntegerId(user.id);
        if (!currentUserId) {
          setChats([]);
          return;
        }

        const recentMessages = await api.chat.getRecentChats();

        const sortedRecentMessages = [...recentMessages].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        const chatsByUser = new Map<number, ChatSummary>();
        sortedRecentMessages.forEach((message) => {
          const otherUser =
            message.senderId === currentUserId
              ? message.receiverId
              : message.senderId;

          if (
            !otherUser ||
            otherUser === currentUserId ||
            chatsByUser.has(otherUser)
          ) {
            return;
          }

          chatsByUser.set(otherUser, {
            userId: otherUser,
            displayName: `${labels.userPrefix} ${otherUser}`,
            lastMessage: formatChatPreviewText(
              message.content,
              resolvedLanguage,
            ),
            timestamp: message.timestamp,
            isRead:
              message.senderId === currentUserId
                ? true
                : Boolean(message.isRead),
          });
        });

        const otherUserIds = Array.from(chatsByUser.keys());
        const namesById: Record<number, string> = {};
        const avatarsById: Record<number, string | undefined> = {};

        await Promise.all(
          otherUserIds.map(async (otherUserId) => {
            const userData = await api.users.getUser(String(otherUserId));
            namesById[otherUserId] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              otherUserId,
            );
            if (userData && userData.avatar) {
              avatarsById[otherUserId] = userData.avatar;
            }
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
  }, [isAuthenticated, labels.userPrefix, user?.id, resolvedLanguage]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const currentUserId = toPositiveIntegerId(user.id);
    if (!currentUserId) {
      return;
    }

    return chatService.onMessageReceived((message) => {
      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;
      if (!otherUserId || otherUserId === currentUserId) {
        return;
      }

      setChats((prevChats) => {
        const existingChat = prevChats.find(
          (chat) => chat.userId === otherUserId,
        );
        const updatedChat: ChatSummary = {
          userId: otherUserId,
          displayName:
            existingChat?.displayName || `${labels.userPrefix} ${otherUserId}`,
          avatar: existingChat?.avatar || userAvatarsById[otherUserId],
          lastMessage: formatChatPreviewText(message.content, resolvedLanguage),
          timestamp: message.timestamp,
          isRead:
            message.senderId === currentUserId ||
            selectedUserId === otherUserId,
        };

        return [
          updatedChat,
          ...prevChats.filter((chat) => chat.userId !== otherUserId),
        ];
      });
    });
  }, [
    isAuthenticated,
    labels.userPrefix,
    user?.id,
    selectedUserId,
    resolvedLanguage,
    userAvatarsById,
  ]);

  useEffect(() => {
    if (!userId) {
      setSelectedUserId(null);
      return;
    }

    const parsedUserId = toPositiveIntegerId(userId);
    setSelectedUserId(parsedUserId ?? null);
  }, [userId]);

  useEffect(() => {
    if (routeSelectedUserId === null) {
      setSessionReturnState(null);
      return;
    }

    if (safeBackPath !== "/") {
      setSessionReturnState({
        chatUserId: String(routeSelectedUserId),
        returnPath: safeBackPath,
      });
      return;
    }

    if (persistedBackPath) {
      setSessionReturnState({
        chatUserId: String(routeSelectedUserId),
        returnPath: persistedBackPath,
      });
    }
  }, [persistedBackPath, routeSelectedUserId, safeBackPath]);

  useEffect(() => {
    if (currentPath === "/chat" && typeof locationState?.fromPath !== "string") {
      clearPersistedChatReturnPath();
      return;
    }

    if (
      routeSelectedUserId !== null &&
      safeBackPath === "/" &&
      persistedReturnState !== null
    ) {
      clearPersistedChatReturnPath();
    }
  }, [currentPath, locationState, persistedReturnState, routeSelectedUserId, safeBackPath]);

  useEffect(() => {
    if (selectedUserId === null) {
      setSelectedDisplayName("");
      return;
    }

    const cachedName = userDisplayNamesById[selectedUserId];
    if (cachedName) {
      setSelectedDisplayName(cachedName);
      setSelectedUserAvatar(userAvatarsById[selectedUserId]);
      return;
    }

    setSelectedDisplayName(`${labels.userPrefix} ${selectedUserId}`);
    setSelectedUserAvatar(undefined);

    let isCancelled = false;
    (async () => {
      const userData = await api.users.getUser(String(selectedUserId));
      if (isCancelled) {
        return;
      }

      const resolvedName = resolveUserDisplayName(
        userData as Record<string, unknown> | null | undefined,
        selectedUserId,
      );
      setSelectedDisplayName(resolvedName);
      if (userData?.avatar) {
        setSelectedUserAvatar(userData.avatar);
      }
      setUserDisplayNamesById((prev) => ({
        ...prev,
        [selectedUserId]: resolvedName,
      }));
      if (userData?.avatar) {
        setUserAvatarsById((prev) => ({
          ...prev,
          [selectedUserId]: userData.avatar,
        }));
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [labels.userPrefix, selectedUserId, userDisplayNamesById, userAvatarsById]);

  const handleSelectUser = (id: number) => {
    const normalizedUserId = toPositiveIntegerId(id);
    if (!normalizedUserId) {
      return;
    }

    setSelectedUserId(normalizedUserId);
    setSelectedDisplayName(
      userDisplayNamesById[normalizedUserId] ||
        `${labels.userPrefix} ${normalizedUserId}`,
    );
    setSelectedUserAvatar(userAvatarsById[normalizedUserId]);
    navigate(`/chat/${normalizedUserId}`, {
      state: {
        fromPath: resolvedBackPath,
        chatListPath: "/chat",
      },
    });
  };

  const handlePageBack = () => {
    if (isMobile && selectedUserId) {
      if (chatListPath) {
        setSelectedUserId(null);
        navigate(chatListPath, {
          state: {
            fromPath: resolvedBackPath,
          },
        });
        return;
      }

      if (resolvedBackPath !== "/chat") {
        clearPersistedChatReturnPath();
      }
      navigate(resolvedBackPath, { replace: true });
      return;
    }

    if (resolvedBackPath !== "/chat") {
      clearPersistedChatReturnPath();
    }
    navigate(resolvedBackPath, { replace: true });
  };

  if (!isAuthenticated) {
    return (
      <PageShell tone="account">
        <SubpageHeader
          onBack={handlePageBack}
          isRTL={isRTL}
          backLabel={labels.back}
          title={labels.messages}
          showLogo={false}
        />
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p>{labels.pleaseLogin}</p>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-primary"
          >
            {labels.goHome}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell tone="account" className="h-[100dvh] overflow-hidden">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <SubpageHeader
          onBack={handlePageBack}
          isRTL={isRTL}
          backLabel={labels.back}
          title={labels.messages}
          showLogo={false}
        />
        <div className="mx-auto flex w-full max-w-7xl flex-1 min-h-0 overflow-hidden px-4 py-4">
          <div className="grid h-full w-full min-h-0 grid-cols-1 gap-4 md:grid-cols-3">
          {/* Chat List - Hidden on mobile if chat selected */}
          <div
            className={`min-h-0 ${isMobile && selectedUserId ? "hidden" : "block"} md:col-span-1`}
          >
            {isLoadingChats ? (
              <LoadingState
                label={
                  resolvedLanguage === "ar"
                    ? "جارٍ تحميل المحادثات..."
                    : "Loading chats..."
                }
                minHeightClassName="min-h-64"
              />
            ) : (
              <ChatList
                chats={chats}
                selectedUserId={selectedUserId}
                onSelectUser={handleSelectUser}
                language={resolvedLanguage}
              />
            )}
          </div>

          {/* Chat Window - Hidden on mobile if no chat selected */}
          <div
            className={`min-h-0 ${isMobile && !selectedUserId ? "hidden" : "block"} md:col-span-2`}
          >
            {selectedUserId ? (
              <ChatWindow
                otherUserId={selectedUserId}
                otherDisplayName={
                  selectedDisplayName ||
                  `${labels.userPrefix} ${selectedUserId}`
                }
                otherUserAvatar={selectedUserAvatar}
                currentUser={{
                  id: user?.id || "",
                  name: user?.name || labels.me,
                }}
                onBack={() => {
                  if (isMobile) {
                    if (chatListPath) {
                      setSelectedUserId(null);
                      navigate(chatListPath, {
                        state: {
                          fromPath: resolvedBackPath,
                        },
                      });
                      return;
                    }

                    if (resolvedBackPath !== "/chat") {
                      clearPersistedChatReturnPath();
                    }
                    navigate(resolvedBackPath, { replace: true });
                    return;
                  }

                  setSelectedUserId(null);
                  navigate("/chat", {
                    state: {
                      fromPath: resolvedBackPath,
                    },
                  });
                }}
                language={resolvedLanguage}
                showBackButton={isMobile}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center rounded-lg border border-border bg-muted/40 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {labels.selectConversation}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {resolvedLanguage === "ar"
                    ? "اختر محادثة من القائمة أو ابدأ محادثة جديدة من صفحة أي منتج"
                    : "Pick a conversation from the list, or start a new one from any listing page"}
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PageShell>
  );
}

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
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";

interface ChatSummary {
  userId: number;
  displayName: string;
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
  const safeBackPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/",
  });
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

  const initialSelectedUserId = toPositiveIntegerId(userId);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialSelectedUserId ?? null,
  );
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [userDisplayNamesById, setUserDisplayNamesById] = useState<
    Record<number, string>
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

        await Promise.all(
          otherUserIds.map(async (otherUserId) => {
            const userData = await api.users.getUser(String(otherUserId));
            namesById[otherUserId] = resolveUserDisplayName(
              userData as Record<string, unknown> | null | undefined,
              otherUserId,
            );
          }),
        );

        setUserDisplayNamesById(namesById);
        setChats(
          Array.from(chatsByUser.values()).map((chat) => ({
            ...chat,
            displayName: namesById[chat.userId] || chat.displayName,
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
    if (selectedUserId === null) {
      setSelectedDisplayName("");
      return;
    }

    const cachedName = userDisplayNamesById[selectedUserId];
    if (cachedName) {
      setSelectedDisplayName(cachedName);
      return;
    }

    setSelectedDisplayName(`${labels.userPrefix} ${selectedUserId}`);

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
      setUserDisplayNamesById((prev) => ({
        ...prev,
        [selectedUserId]: resolvedName,
      }));
    })();

    return () => {
      isCancelled = true;
    };
  }, [labels.userPrefix, selectedUserId, userDisplayNamesById]);

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
    navigate(`/chat/${normalizedUserId}`, {
      state: {
        fromPath: safeBackPath,
      },
    });
  };

  const handlePageBack = () => {
    if (isMobile && selectedUserId) {
      setSelectedUserId(null);
      navigate("/chat", {
        state: {
          fromPath: safeBackPath,
        },
      });
      return;
    }

    navigate(safeBackPath, { replace: true });
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
    <PageShell tone="account">
      <SubpageHeader
        onBack={handlePageBack}
        isRTL={isRTL}
        backLabel={labels.back}
        title={labels.messages}
        showLogo={false}
      />
      <div className="max-w-7xl mx-auto px-4 py-4 h-full min-h-content-70vh">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Chat List - Hidden on mobile if chat selected */}
          <div
            className={`h-full ${isMobile && selectedUserId ? "hidden" : "block"} md:col-span-1`}
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
            className={`h-full ${isMobile && !selectedUserId ? "hidden" : "block"} md:col-span-2`}
          >
            {selectedUserId ? (
              <ChatWindow
                otherUserId={selectedUserId}
                otherDisplayName={
                  selectedDisplayName ||
                  `${labels.userPrefix} ${selectedUserId}`
                }
                currentUser={{
                  id: user?.id || "",
                  name: user?.name || labels.me,
                }}
                onBack={() => {
                  setSelectedUserId(null);
                  navigate("/chat", {
                    state: {
                      fromPath: safeBackPath,
                    },
                  });
                }}
                language={resolvedLanguage}
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
    </PageShell>
  );
}

import { useState, useEffect } from "react";
import { useChatList } from "../useChatList";
import { MessageSquare } from "lucide-react";
import { ChatList } from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { resolveUserDisplayName } from "../../../utils/userDisplayName";
import { resolveDocumentLanguage } from "../../../shared/lib/locale";
import type { Language } from "../../../types";
import { Button } from "../../../shared/ui/button";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { LoadingState } from "../../../shared/ui/loading-state";
import { useMediaQuery } from "../../../shared/hooks/useMediaQuery";
import {
  buildCurrentPath,
  resolveBackPathFromHistoryState,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";
import {
  readPersistedChatReturnState,
  clearPersistedChatReturnPath,
} from "../chatSessionUtils";
import type {
  ChatLocationState,
  PersistedChatReturnState,
} from "../chatSessionUtils";

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

  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    routeSelectedUserId ?? null,
  );
  const isMobile = useMediaQuery("(max-width: 767px)");

  const {
    chats,
    isLoadingChats,
    userDisplayNamesById,
    userAvatarsById,
    setUserDisplayNamesById,
    setUserAvatarsById,
    fetchedIdsRef,
  } = useChatList({
    isAuthenticated,
    userId: user?.id ? String(user.id) : undefined,
    resolvedLanguage,
    userPrefix: labels.userPrefix,
    selectedUserId,
  });

  // Derived reactively from the shared cache — no intermediate state, no flash.
  // As soon as useChatList or the fetch effect populates the map, the header updates.
  const selectedDisplayName = selectedUserId
    ? (userDisplayNamesById[selectedUserId] ?? "")
    : "";
  const selectedUserAvatar = selectedUserId
    ? userAvatarsById[selectedUserId]
    : undefined;

  // Clear postTitle from history state after first render so it only pre-fills once
  useEffect(() => {
    if (locationState?.postTitle) {
      const { postTitle: _, ...restState } = locationState;
      navigate(location.pathname + location.search, {
        replace: true,
        state: restState,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  // Single-responsibility effect: fetch and populate the cache only.
  // Uses the shared fetchedIdsRef from useChatList to avoid duplicate requests.
  useEffect(() => {
    if (selectedUserId === null) return;
    if (fetchedIdsRef.current?.has(selectedUserId)) return; // already fetched by useChatList or us

    fetchedIdsRef.current?.add(selectedUserId);
    let isCancelled = false;
    (async () => {
      const userData = await api.users.getUser(String(selectedUserId));
      if (isCancelled) return;

      const resolvedName = resolveUserDisplayName(
        userData as Record<string, unknown> | null | undefined,
        selectedUserId,
      );
      setUserDisplayNamesById((prev) => ({ ...prev, [selectedUserId]: resolvedName }));
      if (userData?.avatar) {
        setUserAvatarsById((prev) => ({ ...prev, [selectedUserId]: userData.avatar }));
      }
    })();

    return () => { isCancelled = true; };
  }, [selectedUserId, setUserDisplayNamesById, setUserAvatarsById, fetchedIdsRef]);

  const handleSelectUser = (id: number) => {
    const normalizedUserId = toPositiveIntegerId(id);
    if (!normalizedUserId) return;

    setSelectedUserId(normalizedUserId);
    // No need to set displayName/avatar — both are derived from the shared cache.
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
    <PageShell tone="account" className="h-dvh overflow-hidden">
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
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
                otherDisplayName={selectedDisplayName}
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
                initialMessage={locationState?.postTitle
                  ? (resolvedLanguage === "ar"
                    ? `مرحباً، أود الاستفسار عن: ${locationState.postTitle}`
                    : `Hi, I'm interested in "${locationState.postTitle}". Could you provide more details?`)
                  : undefined
                }
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

import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { COLORS } from "../constants/colors";
import { useNavigate, useLocation } from "react-router-dom";

import { ScrollToTop } from "../shared/ui/ScrollToTop";

// Hooks
import { useLocalStorage } from "../shared/hooks/useLocalStorage";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../features/auth/hooks/useUserProfile";
import { useAppTheme } from "../hooks/useAppTheme";
import { api } from "../services/api";
import { chatService } from "../services/chatService";
import { logger } from "../shared/lib/logger";
import { deferredToast } from "../utils/toast";
import { toPositiveIntegerId } from "../utils/idValidation";

const Header = lazy(() =>
  import("../features/marketplace/components/Header").then((m) => ({ default: m.Header })),
);
const Footer = lazy(() =>
  import("../features/marketplace/components/Footer").then((m) => ({ default: m.Footer })),
);
const AppRoutes = lazy(() =>
  import("./routes/AppRoutes").then((m) => ({ default: m.AppRoutes })),
);

const ROUTES_WITH_LOCAL_HEADER = new Set([
  "admin",
  "profile",
  "settings",
  "posts",
  "favorites",
  "chat",
  "sell",
  "faq",
  "help",
  "terms",
  "privacy",
  "post",
  "category",
  "seller",
]);
const KNOWN_PRIMARY_SEGMENTS = new Set([
  "",
  "login",
  "admin",
  ...Array.from(ROUTES_WITH_LOCAL_HEADER),
]);
const AUTH_TOAST_COOLDOWN_MS = 12_000;
const UNREAD_COUNT_REFRESH_MS = 30_000;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    user,
    loading: authLoading,
    logout,
    authError,
    clearAuthError,
  } = useAuth();
  const lastAuthToastRef = useRef<{ message: string; shownAt: number }>({
    message: "",
    shownAt: 0,
  });
  const normalizedPathname = location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");
  const pathSegments = normalizedPathname.split("/").filter(Boolean);
  const primarySegment = pathSegments[0] || "";
  const isAuthRoute = primarySegment === "login";
  const hasLocalPageHeader = ROUTES_WITH_LOCAL_HEADER.has(primarySegment);
  const isUnknownPrimarySegment =
    primarySegment !== "" && !KNOWN_PRIMARY_SEGMENTS.has(primarySegment);
  const shouldShowGlobalHeader =
    !isAuthRoute && !hasLocalPageHeader && !isUnknownPrimarySegment;
  const isChatRoute = normalizedPathname === "/chat" || normalizedPathname.startsWith("/chat/");

  // Custom Hooks
  const { userProfile, setUserProfile, currentUserDisplayName } = useUserProfile();
  const {
    darkMode,
    setDarkMode,
    language,
    toggleLanguage,
  } = useAppTheme();

  // Search State
  const [searchQuery, setSearchQuery] = useLocalStorage(
    "tijarahjo_search_query",
    "",
  );
  const [activeSearchQuery, setActiveSearchQuery] = useLocalStorage(
    "tijarahjo_active_search_query",
    "",
  );
  const searchQueryRef = useRef(searchQuery);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Effects
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    const normalizedAuthError = authError?.trim();
    if (!normalizedAuthError) {
      return;
    }

    const now = Date.now();
    const isDuplicateToast =
      lastAuthToastRef.current.message === normalizedAuthError &&
      now - lastAuthToastRef.current.shownAt < AUTH_TOAST_COOLDOWN_MS;

    if (!isDuplicateToast) {
      deferredToast.error(normalizedAuthError);
      lastAuthToastRef.current = {
        message: normalizedAuthError,
        shownAt: now,
      };
    }

    clearAuthError();
  }, [authError, clearAuthError]);

  useEffect(() => {
    if (!isAuthenticated) {
      chatService.disconnect().catch((error) => {
        logger.warn("[App] SignalR disconnect failed:", error);
      });
      setUnreadNotificationsCount(0);
      return;
    }

    const currentUserId = toPositiveIntegerId(user?.id);
    if (!currentUserId) {
      return;
    }

    chatService.connect(currentUserId).catch((error) => {
      logger.warn("[App] SignalR connect failed:", error);
    });
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      return;
    }

    let isCancelled = false;
    const refreshUnreadCount = async () => {
      try {
        const unreadCount = await api.notifications.getUnreadCount();
        if (!isCancelled) {
          setUnreadNotificationsCount(unreadCount);
        }
      } catch (error) {
        logger.warn("[App] Failed to load unread notifications count:", error);
      }
    };

    void refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, UNREAD_COUNT_REFRESH_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    return chatService.onNotificationReceived((notification) => {
      const routeConversationId = toPositiveIntegerId(
        new URLSearchParams(location.search).get("conversationId"),
      );
      const inChatWithSender = isChatRoute
        && typeof notification.senderUserId === "number"
        && normalizedPathname.endsWith(`/${notification.senderUserId}`);
      const inSameConversation =
        !notification.conversationId ||
        !routeConversationId ||
        notification.conversationId === routeConversationId;

      if (!inChatWithSender || !inSameConversation) {
        deferredToast.info(`${notification.title}: ${notification.body}`);
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const nativeNotification = new Notification(notification.title, {
          body: notification.body,
          tag: `notif-${notification.notificationId}`,
        });
        nativeNotification.onclick = () => {
          window.focus();
          navigate(notification.routeUrl || "/chat");
          nativeNotification.close();
        };
      }

      void api.notifications.getUnreadCount().then((count) => {
        setUnreadNotificationsCount(count);
      }).catch((error) => {
        logger.warn("[App] Failed to refresh unread count after realtime notification:", error);
      });
    });
  }, [isAuthenticated, isChatRoute, location.search, navigate, normalizedPathname]);

  useEffect(() => {
    if (!isAuthenticated || !isChatRoute) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void api.notifications.getUnreadCount().then((count) => {
        setUnreadNotificationsCount(count);
      }).catch((error) => {
        logger.warn("[App] Failed to refresh unread count on chat route:", error);
      });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isChatRoute, location.pathname]);

  useEffect(() => {
    document.title = "TijarahJo - Jordan's Marketplace";
    // Favicon Setup
    const svg = `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="32" width="60" height="56" rx="6" fill="${COLORS.PRIMARY}"/>
        <path d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32" stroke="${COLORS.PRIMARY}" stroke-width="6" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="58" r="12" fill="white"/>
        <text x="50" y="64" font-size="18" font-weight="700" fill="${COLORS.PRIMARY}" text-anchor="middle">T</text>
      </svg>
    `;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    let favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = url;
    return () => URL.revokeObjectURL(url);
  }, []);

  const globalHeader = shouldShowGlobalHeader ? (
    <Suspense fallback={null}>
      <Header
        language={language}
        isAuthenticated={isAuthenticated}
        currentUserDisplayName={userProfile.name}
        userAvatar={userProfile.avatar}
        showBackButton={false}
        showLogo={true}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          searchQueryRef.current = query;
          setSearchQuery(query);
        }}
        onSearchSubmit={() => {
          const normalizedQuery = searchQueryRef.current.trim();
          searchQueryRef.current = normalizedQuery;
          setSearchQuery(normalizedQuery);
          setActiveSearchQuery(normalizedQuery);
          if (!normalizedQuery) {
            return;
          }
          navigate("/search");
        }}
        onShowFavorites={() => navigate("/favorites")}
        onShowMessages={() => navigate("/chat")}
        onShowProfile={() => {
          if (isAuthenticated) navigate("/profile");
          else navigate("/login");
        }}
        onShowSettings={() => navigate("/settings")}
        onShowAdminDashboard={() => navigate("/admin")}
        onShowSellItem={() => navigate("/sell")}
        onLogout={logout}
        onCategoryClick={(cat) => navigate(`/category/${encodeURIComponent(cat)}`)}
        darkMode={darkMode}
        isAdmin={user?.role === "admin"}
        unreadMessagesCount={unreadNotificationsCount}
      />
    </Suspense>
  ) : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {globalHeader}
        <div className="flex-1 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground"
      >
        {language === "ar" ? "تخطي إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>
      {globalHeader}

      <main id="main-content" className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[40vh] flex items-center justify-center">
              <span
                aria-hidden="true"
                className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
              />
            </div>
          }
        >
          <AppRoutes
            language={language}
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            toggleLanguage={toggleLanguage}
            logout={logout}
            setUserProfile={setUserProfile}
            currentUserDisplayName={currentUserDisplayName}
            setSearchQuery={setSearchQuery}
            setActiveSearchQuery={setActiveSearchQuery}
            activeSearchQuery={activeSearchQuery}
          />
        </Suspense>
      </main>

      {!isAuthRoute && (
        <Suspense fallback={null}>
          <Footer language={language} />
        </Suspense>
      )}
      <ScrollToTop />
    </div>
  );
}

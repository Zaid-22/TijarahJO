import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SearchProvider, useSearch } from "../contexts/SearchContext";
import { useNavigate, useLocation } from "react-router-dom";

import { ScrollToTop } from "../shared/ui/ScrollToTop";

// Hooks
// useLocalStorage for search state is now in SearchContext
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../features/auth/hooks/useUserProfile";
import { useAppTheme } from "../hooks/useAppTheme";
import { api } from "../services/api";
import { chatService } from "../services/chatService";
import { logger } from "../shared/lib/logger";
import { deferredToast } from "../utils/toast";
import { toPositiveIntegerId } from "../utils/idValidation";

const Header = lazy(() =>
  import("../features/marketplace/components/Header").then((m) => ({
    default: m.Header,
  })),
);
const Footer = lazy(() =>
  import("../features/marketplace/components/Footer").then((m) => ({
    default: m.Footer,
  })),
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
  return (
    <SearchProvider>
      <AppContent />
    </SearchProvider>
  );
}

function AppContent() {
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
  const isChatRoute =
    normalizedPathname === "/chat" || normalizedPathname.startsWith("/chat/");

  // Custom Hooks
  const { userProfile, setUserProfile, currentUserDisplayName } =
    useUserProfile();
  const { darkMode, setDarkMode, language, toggleLanguage } = useAppTheme();

  // Search state lives in SearchContext
  const { searchQuery, setSearchQuery, submitSearch } = useSearch();
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
    const intervalId = window.setInterval(
      refreshUnreadCount,
      UNREAD_COUNT_REFRESH_MS,
    );

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
      const inChatWithSender =
        isChatRoute &&
        typeof notification.senderUserId === "number" &&
        normalizedPathname.endsWith(`/${notification.senderUserId}`);
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

      void api.notifications
        .getUnreadCount()
        .then((count) => {
          setUnreadNotificationsCount(count);
        })
        .catch((error) => {
          logger.warn(
            "[App] Failed to refresh unread count after realtime notification:",
            error,
          );
        });
    });
  }, [
    isAuthenticated,
    isChatRoute,
    location.search,
    navigate,
    normalizedPathname,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isChatRoute) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void api.notifications
        .getUnreadCount()
        .then((count) => {
          setUnreadNotificationsCount(count);
        })
        .catch((error) => {
          logger.warn(
            "[App] Failed to refresh unread count on chat route:",
            error,
          );
        });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isChatRoute, location.pathname]);

  useEffect(() => {
    document.title = "TijarahJo - Jordan's Marketplace";
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
        onSearchChange={setSearchQuery}
        onSearchSubmit={submitSearch}
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
        onCategoryClick={(cat) =>
          navigate(`/category/${encodeURIComponent(cat)}`)
        }
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
        {language === "ar"
          ? "تخطي إلى المحتوى الرئيسي"
          : "Skip to main content"}
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

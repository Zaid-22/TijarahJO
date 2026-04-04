import {
  useEffect,
  useRef,
  useState,
} from "react";
import { SearchProvider, useSearch } from "../contexts/SearchContext";
import {
  AppSettingsProvider,
  useAppSettings,
} from "../contexts/AppSettingsContext";
import {
  UserProfileProvider,
  useUserProfileContext,
} from "../contexts/UserProfileContext";
import { useNavigate, useLocation } from "react-router-dom";

import { ScrollToTop } from "../shared/ui/ScrollToTop";

import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { deferredToast } from "../utils/toast";
import { useScrollReset } from "./hooks/useScrollReset";
import { useChatConnection } from "./hooks/useChatConnection";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import { MaintenanceScreen } from "./components/MaintenanceScreen";
import type { PublicSystemStatus } from "../services/api/system";

import { Header } from "../features/marketplace/components/Header";
import { Footer } from "../features/marketplace/components/Footer";
import { AppRoutes } from "./routes/AppRoutes";

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

export default function App() {
  return (
    <AppSettingsProvider>
      <UserProfileProvider>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </UserProfileProvider>
    </AppSettingsProvider>
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
  const [maintenanceStatus, setMaintenanceStatus] =
    useState<PublicSystemStatus | null>(null);
  const [hasLoadedMaintenanceStatus, setHasLoadedMaintenanceStatus] =
    useState(false);
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
  const shouldRenderGlobalHeader = shouldShowGlobalHeader;

  // Context Hooks
  const { userProfile } = useUserProfileContext();
  const { darkMode, language } = useAppSettings();

  // Search state lives in SearchContext
  const { searchQuery, setSearchQuery, submitSearch } = useSearch();

  // Extracted effect hooks
  useScrollReset();
  useChatConnection();
  const { unreadNotificationsCount } = useNotificationPolling();

  // Auth error toast (kept inline — too tightly coupled to local ref)
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
    document.title = "TijarahJo - Jordan's Marketplace";
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadMaintenanceStatus = async () => {
      const status = await api.system.getPublicStatus();
      if (!isCurrent) {
        return;
      }

      setMaintenanceStatus(status);
      setHasLoadedMaintenanceStatus(true);
    };

    void loadMaintenanceStatus();

    return () => {
      isCurrent = false;
    };
  }, [normalizedPathname]);

  const globalHeader = shouldRenderGlobalHeader ? (
    <Header
      language={language}
      isAuthenticated={isAuthenticated}
      currentUserDisplayName={userProfile.name}
      userAvatar={userProfile.avatar ?? undefined}
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
      onNotificationsNavigate={(url) => navigate(url)}
      darkMode={darkMode}
      isAdmin={user?.role === "admin"}
      unreadMessagesCount={unreadNotificationsCount}
      authLoading={authLoading}
    />
  ) : null;

  if (maintenanceStatus?.maintenanceMode && !isAuthRoute) {
    return (
      <MaintenanceScreen
        language={language}
        maintenanceReason={maintenanceStatus.maintenanceReason}
        maintenanceExpectedReturn={maintenanceStatus.maintenanceExpectedReturn}
      />
    );
  }

  // Determine main content: show spinner while maintenance status loads, else show routes
  const mainContent = !hasLoadedMaintenanceStatus && !isAuthRoute ? (
    <div className="flex justify-center pt-32 sm:pt-40">
      <span
        aria-hidden="true"
        className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
      />
    </div>
  ) : (
    <AppRoutes />
  );

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
        {mainContent}
      </main>

      {!isAuthRoute && (
        <Footer language={language} />
      )}
      <ScrollToTop />
    </div>
  );
}

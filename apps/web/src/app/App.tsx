import {
  Suspense,
  lazy,
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
    <Suspense fallback={null}>
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
    </Suspense>
  ) : null;

  if (!hasLoadedMaintenanceStatus && !isAuthRoute) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          />
        </div>
      </div>
    );
  }

  if (maintenanceStatus?.maintenanceMode && !isAuthRoute) {
    return (
      <MaintenanceScreen
        language={language}
        maintenanceReason={maintenanceStatus.maintenanceReason}
        maintenanceExpectedReturn={maintenanceStatus.maintenanceExpectedReturn}
      />
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

      <Suspense
        fallback={
          <main
            id="main-content"
            className="flex-1 min-h-[80vh] flex items-center justify-center"
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
            />
          </main>
        }
      >
        <main id="main-content" className="flex-1">
          <AppRoutes />
        </main>

        {!isAuthRoute && (
          <Footer language={language} />
        )}
      </Suspense>
      <ScrollToTop />
    </div>
  );
}

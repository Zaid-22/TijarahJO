import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";
import { SearchProvider, useSearch } from "../contexts/SearchContext";
import { CompareProvider } from "../contexts/CompareContext";
import { useCompare } from "../contexts/CompareContext";
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
import { userHasAdminAccess } from "../contexts/authUtils";
import { api } from "../services/api";
import { deferredToast } from "../utils/toast";
import { useScrollReset } from "./hooks/useScrollReset";
import { useChatConnection } from "./hooks/useChatConnection";
import { useNotificationPolling } from "./hooks/useNotificationPolling";
import type { PublicSystemStatus } from "../services/api/system";
import { lazyImportWithRetry } from "../shared/lib/lazyImportWithRetry";

import { Header } from "../features/marketplace/components/Header";
import { ComparePanel } from "../features/marketplace/components/ComparePanel";
import { AppRoutes } from "./routes/AppRoutes";

const MaintenanceScreen = lazy(
  lazyImportWithRetry(
    () =>
      import("./components/MaintenanceScreen").then((m) => ({
        default: m.MaintenanceScreen,
      })),
    "lazy-import-retry:maintenance-screen",
  ),
);
const Footer = lazy(
  lazyImportWithRetry(
    () =>
      import("../features/marketplace/components/Footer").then((m) => ({
        default: m.Footer,
      })),
    "lazy-import-retry:footer",
  ),
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
  "seller",
]);
const KNOWN_PRIMARY_SEGMENTS = new Set([
  "",
  "login",
  "admin",
  "compare",
  "category",
  ...Array.from(ROUTES_WITH_LOCAL_HEADER),
]);
const AUTH_TOAST_COOLDOWN_MS = 12_000;
const MAINTENANCE_STATUS_CACHE_KEY = "tijarahjo_public_system_status_v1";
const MAINTENANCE_STATUS_TTL_MS = 60_000;
const COMPARISON_EXCLUDED_SEGMENTS = new Set([
  "admin",
  "settings",
  "profile",
  "chat",
  "sell",
  "login",
  "register",
]);
const MAINTENANCE_STATUS_REFRESH_MS = 30_000;

type CachedMaintenanceStatus = {
  cachedAt: number;
  status: PublicSystemStatus;
};

function readCachedMaintenanceStatus(): PublicSystemStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(MAINTENANCE_STATUS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedMaintenanceStatus;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.cachedAt !== "number" ||
      typeof parsed.status !== "object" ||
      parsed.status === null
    ) {
      return null;
    }

    if (Date.now() - parsed.cachedAt > MAINTENANCE_STATUS_TTL_MS) {
      return null;
    }

    return parsed.status;
  } catch {
    return null;
  }
}

function writeCachedMaintenanceStatus(status: PublicSystemStatus): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      MAINTENANCE_STATUS_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        status,
      } satisfies CachedMaintenanceStatus),
    );
  } catch {
    // Ignore cache write failures so app startup never breaks.
  }
}

export default function App() {
  return (
    <AppSettingsProvider>
      <UserProfileProvider>
        <SearchProvider>
          <CompareProvider>
            <AppContent />
          </CompareProvider>
        </SearchProvider>
      </UserProfileProvider>
    </AppSettingsProvider>
  );
}

function AppContent() {
  const { compareCount } = useCompare();
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
    useState<PublicSystemStatus | null>(() => readCachedMaintenanceStatus());
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
  const { userProfile, isLoading: isProfileLoading } = useUserProfileContext();
  const { darkMode, language } = useAppSettings();

  // Search state lives in SearchContext
  const { searchQuery, setSearchQuery, submitSearch } = useSearch();

  // Extracted effect hooks
  useScrollReset();
  useChatConnection();
  const { unreadNotificationsCount } = useNotificationPolling({
    suspended:
      maintenanceStatus === null ||
      (maintenanceStatus?.maintenanceMode ?? false) ||
      (maintenanceStatus?.serviceUnavailable ?? false),
  });

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
    document.title = "TijarahJO";
  }, []);

  useEffect(() => {
    let isCurrent = true;
    let isLoading = false;

    const loadMaintenanceStatus = async () => {
      if (isLoading) {
        return;
      }

      isLoading = true;
      try {
        const status = await api.system.getPublicStatus();
        if (!isCurrent) {
          return;
        }

        setMaintenanceStatus(status);
        writeCachedMaintenanceStatus(status);
      } finally {
        isLoading = false;
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadMaintenanceStatus();
      }
    };

    void loadMaintenanceStatus();
    const intervalId = window.setInterval(
      () => void loadMaintenanceStatus(),
      MAINTENANCE_STATUS_REFRESH_MS,
    );
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

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
      onShowCreatePost={() => navigate("/sell")}
      onLogout={logout}
      onCategoryClick={(cat) =>
        navigate(`/category/${encodeURIComponent(cat)}`)
      }
      onNotificationsNavigate={(url) => navigate(url)}
      darkMode={darkMode}
      isAdmin={userHasAdminAccess(user)}
      isMaintenanceMode={maintenanceStatus?.maintenanceMode ?? false}
      unreadMessagesCount={unreadNotificationsCount}
      authLoading={authLoading || isProfileLoading}
    />
  ) : null;

  if (maintenanceStatus?.maintenanceMode && !isAuthRoute && !userHasAdminAccess(user)) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <MaintenanceScreen
          language={language}
          maintenanceReason={maintenanceStatus.maintenanceReason}
          maintenanceExpectedReturn={maintenanceStatus.maintenanceExpectedReturn}
        />
      </Suspense>
    );
  }

  const shouldShowComparePanel = 
    isAuthenticated && !isAuthRoute && !COMPARISON_EXCLUDED_SEGMENTS.has(primarySegment);
  const isComparePanelVisible = shouldShowComparePanel && compareCount > 0;
  const shouldShowFooter = !isAuthRoute && primarySegment !== "admin";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground"
      >
        {language === "ar"
          ? "تخطي إلى المحتوى الرئيسي"
          : "Skip to main content"}
      </a>
      {globalHeader}

      <main id="main-content" className="flex-1">
        <AppRoutes />
      </main>

      {shouldShowFooter ? (
        <Suspense fallback={null}>
          <Footer language={language} />
        </Suspense>
      ) : null}
      <ScrollToTop avoidBottomOverlay={isComparePanelVisible} />
      {shouldShowComparePanel && <ComparePanel />}
    </div>
  );
}

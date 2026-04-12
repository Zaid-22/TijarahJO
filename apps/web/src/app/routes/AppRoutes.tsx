import { Suspense, type ReactElement } from "react";
import { Routes, useNavigate, useLocation, Navigate } from "react-router-dom";
import { renderAppRouteElements } from "./AppRouteElements";
import { usePostActions } from "./usePostActions";
import { useProfileSaveAction } from "./useProfileSaveAction";
import { useMarketplaceRouteState } from "./useMarketplaceRouteState";
import { LoadingState } from "../../shared/ui/loading-state";
import { useSearch } from "../../contexts/SearchContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useUserProfileContext } from "../../contexts/UserProfileContext";
import { userHasAdminAccess } from "../../contexts/authUtils";
import { LoginPromptModal } from "../../features/auth/components/LoginPromptModal";
import { useState, useEffect } from "react";
import {
  applyLoginUserDataToProfile,
  isProfileCompleteForRouting,
} from "./appRoutesUtils";
import { APP_ROUTE_PATHS } from "./routeConfig";

function normalizePathname(pathname: string): string {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "");
  return normalized || "/";
}

function HomeRouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6 pb-2">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-muted/60 w-full min-h-96 sm:min-h-80 md:min-h-0 md:aspect-[21/8]" />
          <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 pb-2">
            <div className="w-8 h-2.5 rounded-full bg-muted/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-muted/80" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedPathname = normalizePathname(location.pathname);

  const { language, darkMode, setDarkMode, toggleLanguage } = useAppSettings();
  const { isAuthenticated, logout, loading: isAuthLoading, user } = useAuth();
  const { userProfile, setUserProfile, currentUserDisplayName, isLoading: isProfileLoading, isProfileComplete } =
    useUserProfileContext();
  const { activeSearchQuery } = useSearch();

  const routeState = useMarketplaceRouteState({
    pathname: location.pathname,
    searchQuery: activeSearchQuery,
    language,
    userProfile,
  });

  const postActions = usePostActions({
    userProfile,
    fetchPostsFromBackend: routeState.fetchPostsFromBackend,
  });

  const saveProfile = useProfileSaveAction({
    navigate,
    userProfile,
    setUserProfile,
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const promptLoginModal = () => setShowAuthModal(true);

  const shouldShowProfileCompletion = isAuthenticated && !isAuthLoading && !isProfileLoading && !isProfileComplete;

  useEffect(() => {
    if (
      isAuthenticated &&
      !isAuthLoading &&
      !isProfileLoading &&
      userHasAdminAccess(user) &&
      location.pathname === "/login"
    ) {
      navigate("/admin", { replace: true });
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    isProfileLoading,
    user,
    location.pathname,
    navigate,
  ]);

  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    isAuthLoading ? (
      <LoadingState minHeightClassName="min-h-96" />
    ) : isAuthenticated ? (
      element
    ) : (
      <Navigate
        to="/login"
        replace
        state={{ fromPath: `${location.pathname}${location.search}` }}
      />
    );

  const routeFallback =
    normalizedPathname === "/" ? (
      <HomeRouteLoadingFallback />
    ) : (
      <LoadingState minHeightClassName="min-h-[80vh]" />
    );

  if (isAuthLoading || isProfileLoading) {
    return routeFallback;
  }

  if (shouldShowProfileCompletion && location.pathname !== APP_ROUTE_PATHS.completeProfile) {
    return <Navigate to={APP_ROUTE_PATHS.completeProfile} replace />;
  }

  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        {renderAppRouteElements({
          language,
          isAuthenticated,
          userProfile,
          darkMode,
          setDarkMode,
          toggleLanguage,
          logout,
          setUserProfile,
          currentUserDisplayName,
          routeState,
          postActions,
          saveProfile,
          navigate,
          redirectToLogin,
          promptLoginModal,
          requireAuth,
        })}
      </Routes>
      <LoginPromptModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        language={language}
        onLogin={(userData) => {
          const nextProfile = applyLoginUserDataToProfile(userProfile, userData);
          setUserProfile(nextProfile);

          const intendedPath = userHasAdminAccess({
            role: userData.role ?? "user",
            hasAdminAccess: userData.hasAdminAccess,
            permissions: userData.permissions,
          })
            ? APP_ROUTE_PATHS.admin
            : `${location.pathname}${location.search}`;

          if (
            !isProfileCompleteForRouting(userData)
          ) {
            navigate(APP_ROUTE_PATHS.completeProfile, {
              replace: true,
              state: { fromPath: intendedPath },
            });
          } else if (
            userHasAdminAccess({
              role: userData.role ?? "user",
              hasAdminAccess: userData.hasAdminAccess,
              permissions: userData.permissions,
            })
          ) {
            navigate(APP_ROUTE_PATHS.admin, { replace: true });
          }
          setShowAuthModal(false);
        }}
        onContinueAsGuest={() => setShowAuthModal(false)}
      />
    </Suspense>
  );
}

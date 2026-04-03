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
import { LoginPromptModal } from "../../features/auth/components/LoginPromptModal";
import { useState } from "react";
import { applyLoginUserDataToProfile } from "./appRoutesUtils";

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const { language, darkMode, setDarkMode, toggleLanguage } = useAppSettings();
  const { isAuthenticated, logout, loading: isAuthLoading } = useAuth();
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

  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    isAuthLoading ? (
      <LoadingState minHeightClassName="min-h-[40vh]" />
    ) : isAuthenticated ? (
      element
    ) : (
      <Navigate
        to="/login"
        replace
        state={{ fromPath: `${location.pathname}${location.search}` }}
      />
    );

  return (
    <Suspense fallback={<LoadingState minHeightClassName="min-h-[80vh]" />}>
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
          setUserProfile(
            applyLoginUserDataToProfile(userProfile, userData),
          );
          if (userData.role === "admin") {
            navigate("/admin", { replace: true });
          }
          setShowAuthModal(false);
        }}
        onContinueAsGuest={() => setShowAuthModal(false)}
      />
      {shouldShowProfileCompletion && location.pathname !== "/complete-profile" && (
        <Navigate to="/complete-profile" replace />
      )}
    </Suspense>
  );
}

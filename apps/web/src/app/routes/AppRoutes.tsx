import { Suspense, type ReactElement } from "react";
import {
  Routes,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Language, UserProfile } from "../../types";
import { renderAppRouteElements } from "./AppRouteElements";
import { usePostActions } from "./usePostActions";
import { useProfileSaveAction } from "./useProfileSaveAction";
import { useMarketplaceRouteState } from "./useMarketplaceRouteState";
import { LoadingState } from "../../shared/ui/loading-state";

interface AppRoutesProps {
  language: Language;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
  setSearchQuery: (q: string) => void;
  setActiveSearchQuery: (q: string) => void;
  activeSearchQuery: string;
}

export function AppRoutes(props: AppRoutesProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = useMarketplaceRouteState({
    pathname: location.pathname,
    searchQuery: props.activeSearchQuery,
    language: props.language,
    userProfile: props.userProfile,
  });

  const postActions = usePostActions({
    userProfile: props.userProfile,
    fetchPostsFromBackend: routeState.fetchPostsFromBackend,
  });

  const saveProfile = useProfileSaveAction({
    navigate,
    userProfile: props.userProfile,
    setUserProfile: props.setUserProfile,
  });

  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    props.isAuthenticated
      ? element
      : (
          <Navigate
            to="/login"
            replace
            state={{ fromPath: `${location.pathname}${location.search}` }}
          />
        );

  return (
    <Suspense
      fallback={<LoadingState minHeightClassName="min-h-[40vh]" />}
    >
      <Routes>
        {renderAppRouteElements({
          appProps: props,
          routeState,
          postActions,
          saveProfile,
          navigate,
          redirectToLogin,
          requireAuth,
        })}
      </Routes>
    </Suspense>
  );
}

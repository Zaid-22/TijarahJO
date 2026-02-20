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
  searchQuery: string;
}

export function AppRoutes(props: AppRoutesProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = useMarketplaceRouteState({
    pathname: location.pathname,
    searchQuery: props.searchQuery,
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
    props.isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"
          />
          <span>Loading...</span>
        </div>
      }
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

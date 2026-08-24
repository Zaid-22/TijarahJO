import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useUserProfileContext } from "../../../contexts/UserProfileContext";
import { userHasAdminAccess } from "../../../contexts/authUtils";
import { LoadingState } from "../../../shared/ui/loading-state";

export function AdminRoute() {
  const { user, loading } = useAuth();
  const {
    isLoading: isProfileLoading,
    isProfileComplete,
    profileError,
  } = useUserProfileContext();
  const location = useLocation();
  const hasAdminAccess = userHasAdminAccess(user);

  if (loading || (hasAdminAccess && isProfileLoading)) {
    return <LoadingState minHeightClassName="min-h-screen" />;
  }

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  if (!profileError && !isProfileComplete) {
    return <Navigate to="/complete-profile" state={{ fromPath: location.pathname }} replace />;
  }

  return <Outlet />;
}

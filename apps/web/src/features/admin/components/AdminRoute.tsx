import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { userHasAdminAccess } from "../../../contexts/authUtils";
import { LoadingState } from "../../../shared/ui/loading-state";

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState minHeightClassName="min-h-screen" />;
  }

  if (!userHasAdminAccess(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

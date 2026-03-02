import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { LoadingState } from "../../../shared/ui/loading-state";

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState minHeightClassName="min-h-screen" />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

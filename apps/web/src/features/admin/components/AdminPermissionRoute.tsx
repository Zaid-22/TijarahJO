import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  userHasAdminAccess,
  userHasAdminPermission,
} from "../../../contexts/authUtils";
import { LoadingState } from "../../../shared/ui/loading-state";
import type { AdminPermissionKey } from "../adminPermissions";

type Props = {
  children: ReactNode;
  requiredPermission?: AdminPermissionKey;
};

export function AdminPermissionRoute({
  children,
  requiredPermission,
}: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState minHeightClassName="min-h-screen" />;
  }

  if (!userHasAdminAccess(user)) {
    return <Navigate to="/" replace />;
  }

  if (
    requiredPermission &&
    !userHasAdminPermission(user, requiredPermission)
  ) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { userHasAdminAccess } from "../../../contexts/authUtils";
import { LoadingState } from "../../../shared/ui/loading-state";
import { api } from "../../../services/api";

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (userHasAdminAccess(user) && user?.id) {
       api.users.getUser(user.id).then((profile) => {
         if (!profile) {
           setProfileComplete(false);
           return;
         }
         
         const isComplete = Boolean(profile.phone && profile.city && profile.area);
         setProfileComplete(isComplete);
       }).catch(() => {
           // On failure, conservatively assume it's incomplete so they at least get directed back to login or try again.
           // However it's better to just let them fail on the completion screen if api is fully down.
           setProfileComplete(false);
       });
    }
  }, [user]);

  if (loading || (userHasAdminAccess(user) && profileComplete === null)) {
    return <LoadingState minHeightClassName="min-h-screen" />;
  }

  if (!userHasAdminAccess(user)) {
    return <Navigate to="/" replace />;
  }

  if (profileComplete === false) {
    return <Navigate to="/complete-profile" state={{ fromPath: location.pathname }} replace />;
  }

  return <Outlet />;
}

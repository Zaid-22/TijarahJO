import { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
// DEFAULT_AVATAR_SRC removed - resolveAvatarSrc now handles null by returning null for letter fallbacks

function formatJoinedDate(value: unknown, fallback: string): string {
  if (value !== null && value !== undefined && value !== "") {
    const parsed = new Date(value as string | number | Date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  }

  return fallback;
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const CURRENT_USER_ID = user?.id || "";
  const CURRENT_USER_DISPLAY_NAME = user?.name || user?.firstName || "Guest";

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: CURRENT_USER_ID,
    name: CURRENT_USER_DISPLAY_NAME,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    city: "",
    area: "",
    location: "",
    bio: "",
    avatar: null,
    joinedDate: "Jan 2024",
  });
  const [isLoading, setIsLoading] = useState(true);
  const fetchedForUserRef = useRef<string>("");

  useEffect(() => {
    if (user && isAuthenticated) {
      const fullName =
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "";
      setUserProfile((prev) => ({
        ...prev,
        id: user.id || prev.id,
        name: fullName,
        firstName: user.firstName || prev.firstName || "",
        lastName: user.lastName || prev.lastName || "",
        email: user.email || prev.email || "",
        avatar: user.avatar || prev.avatar || null,
      }));
    }
  }, [user, isAuthenticated]);

  const fetchProfileData = useCallback(async () => {
    const userId = String(user?.id || "").trim();
    if (!isAuthenticated || !userId) {
      fetchedForUserRef.current = "";
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const backendUser = await api.users.getUser(userId);
      if (!backendUser) {
        setIsLoading(false);
        return;
      }

      const firstName = backendUser.firstName || user?.firstName || "";
      const lastName = backendUser.lastName || user?.lastName || "";
      const displayName =
        `${firstName} ${lastName}`.trim() ||
        backendUser.name ||
        user?.name ||
        user?.email ||
        "";
      const city = backendUser.city || "";
      const area = backendUser.area || "";

      setUserProfile((prev) => ({
        ...prev,
        id: String(backendUser.id || backendUser.userId || userId),
        firstName,
        lastName,
        name: displayName,
        email: backendUser.email || prev.email,
        phone: backendUser.phone || prev.phone || "",
        bio: backendUser.bio || prev.bio || "",
        avatar: backendUser.avatar || prev.avatar || null,
        city,
        area,
        location: area ? `${city}, ${area}` : city,
        joinedDate: formatJoinedDate(
          backendUser.joinedAt,
          prev.joinedDate,
        ),
      }));
    } catch (error) {
      logger.warn("[useUserProfile] Failed to fetch extended profile:", error);
    } finally {
      fetchedForUserRef.current = userId;
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.firstName, user?.lastName, user?.name, user?.email]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const isProfileComplete = Boolean(
    userProfile.phone && userProfile.city && userProfile.area
  );

  // Guard against the render gap between auth state changing to authenticated
  // and the profile fetch effect starting. Without this, shouldShowProfileCompletion
  // in AppRoutes can briefly evaluate true and redirect to /complete-profile.
  const pendingFetchForNewUser =
    isAuthenticated && !!CURRENT_USER_ID && fetchedForUserRef.current !== CURRENT_USER_ID;

  return {
    userProfile,
    setUserProfile,
    currentUserDisplayName: CURRENT_USER_DISPLAY_NAME,
    isLoading: isLoading || pendingFetchForNewUser,
    isProfileComplete,
    refreshProfile: fetchProfileData,
  };
}

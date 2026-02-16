import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

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
  const CURRENT_USER_NAME = user?.name || user?.firstName || "Guest";

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    city: "",
    area: "",
    location: "",
    bio: "",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    joinedDate: "Jan 2024",
  });

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
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const userId = String(user?.id || "").trim();
    if (!isAuthenticated || !userId) {
      return;
    }

    let cancelled = false;

    const fetchUserProfile = async () => {
      try {
        const backendUser = await api.users.getUser(userId);
        if (cancelled || !backendUser) {
          return;
        }

        const firstName =
          backendUser.firstName || backendUser.FirstName || user?.firstName || "";
        const lastName =
          backendUser.lastName || backendUser.LastName || user?.lastName || "";
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
          id: String(backendUser.id || backendUser.UserID || userId),
          firstName,
          lastName,
          name: displayName,
          email: backendUser.email || backendUser.Email || prev.email,
          phone: backendUser.phone || prev.phone || "",
          city,
          area,
          location: area ? `${city}, ${area}` : city,
          joinedDate: formatJoinedDate(
            backendUser.JoinedDate ||
              backendUser.joinedDate ||
              backendUser.JoinDate ||
              backendUser.joinedAt,
            prev.joinedDate,
          ),
        }));
      } catch (error) {
        console.warn("[useUserProfile] Failed to fetch extended profile:", error);
      }
    };

    fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.firstName, user?.lastName, user?.name, user?.email]);

  return {
    userProfile,
    setUserProfile,
    currentUserName: CURRENT_USER_NAME,
  };
}

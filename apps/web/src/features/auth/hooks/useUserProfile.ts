import { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";

// How many consecutive null/error responses to retry before giving up and
// unblocking the UI. Kept outside the component so it's never re-declared.
const MAX_FETCH_RETRIES = 3;

// Exponential back-off delays (ms) for each retry attempt: 300ms, 600ms, 1200ms.
const RETRY_DELAY_MS = (attempt: number) => 300 * Math.pow(2, attempt - 1);

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
    cityId: undefined,
    areaId: undefined,
    location: "",
    bio: "",
    avatar: null,
    joinedDate: "Jan 2024",
  });
  const [isLoading, setIsLoading] = useState(true);
  const fetchedForUserRef = useRef<string>("");
  // Tracks consecutive null/error responses for retry/give-up logic.
  const fetchRetryCountRef = useRef<number>(0);
  // Holds the active retry timer so it can be cancelled on unmount/user change.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync basic identity fields from auth state (name, email, avatar) immediately
  // when auth resolves. phone/city/area come exclusively from the profile fetch.
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

    // Cancel any pending retry timer for a previous attempt.
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (!isAuthenticated || !userId) {
      fetchedForUserRef.current = "";
      fetchRetryCountRef.current = 0;
      setIsLoading(false);
      return;
    }

    // Skip re-fetch if we already have good data for this user.
    // refreshProfile() callers bypass this by resetting the ref first.
    if (fetchedForUserRef.current === userId) {
      setIsLoading(false);
      return;
    }

    // Helper: advance the "already fetched" guard and reset retry state.
    const markAsFetched = () => {
      fetchRetryCountRef.current = 0;
      fetchedForUserRef.current = userId;
    };

    // Helper: schedule an active retry after a back-off delay.
    // This is the fix for the passive-retry issue — without this, a failed
    // fetch would leave the hook stuck in loading because the useCallback
    // deps (isAuthenticated, user?.id) haven't changed, so the effect that
    // calls fetchProfileData never re-fires.
    const scheduleRetry = () => {
      const attempt = fetchRetryCountRef.current;
      if (attempt >= MAX_FETCH_RETRIES) {
        // Exhausted all retries — unblock the UI. isProfileComplete will be
        // false only if the backend is genuinely unavailable, not a transient glitch.
        markAsFetched();
        setIsLoading(false);
        return;
      }
      const delay = RETRY_DELAY_MS(attempt);
      logger.warn(
        `[useUserProfile] Profile fetch failed (attempt ${attempt}/${MAX_FETCH_RETRIES}), retrying in ${delay}ms`,
      );
      // Keep isLoading = true during the back-off so the UI stays in loading state.
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        void fetchProfileData();
      }, delay);
    };

    setIsLoading(true);
    let fetchSucceeded = false;
    try {
      const backendUser = await api.users.getUser(userId);

      if (!backendUser) {
        // Backend returned null — transient error or race during rapid reloads.
        // Increment the counter and schedule an active retry with back-off so
        // we don't depend on React re-triggering the effect.
        fetchRetryCountRef.current += 1;
        scheduleRetry();
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
        cityId: backendUser.cityId ?? prev.cityId,
        areaId: backendUser.areaId ?? prev.areaId,
        location: area ? `${city}, ${area}` : city,
        joinedDate: formatJoinedDate(
          backendUser.joinedAt,
          prev.joinedDate,
        ),
      }));
      fetchSucceeded = true;
    } catch (error) {
      logger.warn("[useUserProfile] Failed to fetch extended profile:", error);
      // Treat thrown errors the same as null — schedule an active retry.
      fetchRetryCountRef.current += 1;
      scheduleRetry();
    } finally {
      // Advance the guard only on success. On failure, scheduleRetry() above
      // will call fetchProfileData() again after the back-off delay, keeping
      // isLoading = true during the wait.
      if (fetchSucceeded) {
        markAsFetched();
        setIsLoading(false);
      }
    }
  // Only re-create when auth state or user identity changes, NOT on every
  // user field update (firstName, email, etc.), which caused infinite loops
  // and spurious redirects to /complete-profile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Trigger fetch whenever auth state or user identity changes.
  useEffect(() => {
    fetchProfileData();
    // Clean up any pending retry timer when the effect re-runs or unmounts.
    return () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [fetchProfileData]);

  const isProfileComplete = Boolean(
    userProfile.phone &&
    (
      (userProfile.city && userProfile.area) ||
      (
        Number.isInteger(userProfile.cityId) &&
        Number(userProfile.cityId) > 0 &&
        Number.isInteger(userProfile.areaId) &&
        Number(userProfile.areaId) > 0
      )
    )
  );

  // Guard against the render gap between auth state changing to authenticated
  // and the profile fetch effect starting. Without this, shouldShowProfileCompletion
  // in AppRoutes can briefly evaluate true and redirect to /complete-profile.
  const pendingFetchForNewUser =
    isAuthenticated && !!CURRENT_USER_ID && fetchedForUserRef.current !== CURRENT_USER_ID;

  const refreshProfile = useCallback(() => {
    // Reset both the fetched guard and retry counter so fetchProfileData
    // re-fetches from scratch (ignoring the skip-if-already-fetched guard).
    fetchedForUserRef.current = "";
    fetchRetryCountRef.current = 0;
    return fetchProfileData();
  }, [fetchProfileData]);

  return {
    userProfile,
    setUserProfile,
    currentUserDisplayName: CURRENT_USER_DISPLAY_NAME,
    isLoading: isLoading || pendingFetchForNewUser,
    isProfileComplete,
    refreshProfile,
  };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
import {
  canAdoptProfileForAuthTransition,
  createProfileForAuthUser,
  isOwnedProfileRequestCurrent,
  type ProfileOwnerTransition,
} from "../profileState";

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

  const [userProfile, setUserProfileState] = useState<UserProfile>(() =>
    createProfileForAuthUser(isAuthenticated ? user : null),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fetchedForUserRef = useRef<string>("");
  const profileOwnerIdRef = useRef(isAuthenticated ? CURRENT_USER_ID : "");
  const renderedAuthUserIdRef = useRef(
    isAuthenticated ? CURRENT_USER_ID : "",
  );
  renderedAuthUserIdRef.current = isAuthenticated ? CURRENT_USER_ID : "";
  const profileRequestRunIdRef = useRef(0);
  // Tracks consecutive null/error responses for retry/give-up logic.
  const fetchRetryCountRef = useRef<number>(0);
  // Holds the active retry timer so it can be cancelled on unmount/user change.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCurrentProfileOwner = useCallback((candidateUserId: string) => {
    const normalizedCandidate = String(candidateUserId || "").trim();
    return (
      !!normalizedCandidate &&
      renderedAuthUserIdRef.current === normalizedCandidate &&
      profileOwnerIdRef.current === normalizedCandidate
    );
  }, []);

  const setUserProfile = useCallback(
    (
      nextProfile: UserProfile,
      ownerTransition?: ProfileOwnerTransition,
    ): boolean => {
      const nextOwnerId = String(nextProfile.id || "").trim();
      if (ownerTransition) {
        const canAdoptNextOwner = canAdoptProfileForAuthTransition({
          expectedPreviousOwnerId: ownerTransition.expectedPreviousOwnerId,
          nextOwnerId,
          profileOwnerId: profileOwnerIdRef.current,
          renderedAuthUserId: renderedAuthUserIdRef.current,
        });

        if (!canAdoptNextOwner) {
          logger.warn(
            "[useUserProfile] Ignored a stale authenticated profile transition.",
          );
          return false;
        }

        profileRequestRunIdRef.current += 1;
        profileOwnerIdRef.current = nextOwnerId;
        fetchedForUserRef.current = "";
        fetchRetryCountRef.current = 0;
        if (retryTimerRef.current !== null) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
        setUserProfileState(nextProfile);
        setProfileError(null);
        setIsLoading(true);
        return true;
      }

      if (!isCurrentProfileOwner(nextOwnerId)) {
        logger.warn(
          "[useUserProfile] Ignored a profile update for a stale account owner.",
        );
        return false;
      }

      setUserProfileState(nextProfile);
      setProfileError(null);
      return true;
    },
    [isCurrentProfileOwner],
  );

  // Extended profile fields belong to exactly one authenticated user. Reset them
  // before a new identity can render, then overlay same-user auth refreshes only.
  useEffect(() => {
    const nextUserId = isAuthenticated ? String(user?.id || "").trim() : "";
    const identityChanged = profileOwnerIdRef.current !== nextUserId;

    if (!nextUserId) {
      profileRequestRunIdRef.current += 1;
      profileOwnerIdRef.current = "";
      fetchedForUserRef.current = "";
      fetchRetryCountRef.current = 0;
      setUserProfileState(createProfileForAuthUser(null));
      setProfileError(null);
      setIsLoading(false);
      return;
    }

    if (identityChanged) {
      profileRequestRunIdRef.current += 1;
      profileOwnerIdRef.current = nextUserId;
      fetchedForUserRef.current = "";
      fetchRetryCountRef.current = 0;
      setUserProfileState(createProfileForAuthUser(user));
      setProfileError(null);
      setIsLoading(true);
      return;
    }

    const authProfile = createProfileForAuthUser(user);
    setUserProfileState((prev) => ({
      ...prev,
      id: nextUserId,
      name: authProfile.name,
      firstName: authProfile.firstName,
      lastName: authProfile.lastName,
      email: authProfile.email,
      avatar: user?.avatar ?? prev.avatar,
    }));
  }, [isAuthenticated, user]);

  const fetchProfileData = useCallback(async () => {
    const userId = String(user?.id || "").trim();
    const runId = ++profileRequestRunIdRef.current;
    const isCurrentRequest = () =>
      isOwnedProfileRequestCurrent({
        requestRunId: runId,
        currentRunId: profileRequestRunIdRef.current,
        requestedUserId: userId,
        profileOwnerId: profileOwnerIdRef.current,
      });

    // Cancel any pending retry timer for a previous attempt.
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (!isAuthenticated || !userId) {
      fetchedForUserRef.current = "";
      fetchRetryCountRef.current = 0;
      setProfileError(null);
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
      if (!isCurrentRequest()) {
        return;
      }
      fetchRetryCountRef.current = 0;
      fetchedForUserRef.current = userId;
    };

    // Helper: schedule an active retry after a back-off delay.
    // This is the fix for the passive-retry issue — without this, a failed
    // fetch would leave the hook stuck in loading because the useCallback
    // deps (isAuthenticated, user?.id) haven't changed, so the effect that
    // calls fetchProfileData never re-fires.
    const scheduleRetry = (errorMessage: string) => {
      if (!isCurrentRequest()) {
        return;
      }
      const attempt = fetchRetryCountRef.current;
      if (attempt >= MAX_FETCH_RETRIES) {
        // Exhausted all retries. Preserve the failure separately from profile
        // completeness so routing never treats an outage as missing fields.
        markAsFetched();
        setProfileError(errorMessage);
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

      if (!isCurrentRequest()) {
        return;
      }

      if (!backendUser) {
        // A null result is reserved for a confirmed missing profile (404).
        // This is different from a request failure and may legitimately route
        // the user to profile completion.
        markAsFetched();
        setProfileError(null);
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

      setUserProfileState({
        id: String(backendUser.id || backendUser.userId || userId),
        firstName,
        lastName,
        name: displayName,
        email: backendUser.email || user?.email || "",
        phone: backendUser.phone || "",
        bio: backendUser.bio || "",
        avatar: backendUser.avatar || user?.avatar || null,
        city,
        area,
        cityId: backendUser.cityId,
        areaId: backendUser.areaId,
        location: area ? `${city}, ${area}` : city,
        joinedDate: formatJoinedDate(
          backendUser.joinedAt,
          "Jan 2024",
        ),
      });
      setProfileError(null);
      fetchSucceeded = true;
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }
      logger.warn("[useUserProfile] Failed to fetch extended profile:", error);
      fetchRetryCountRef.current += 1;
      scheduleRetry(
        error instanceof Error
          ? error.message
          : "Failed to load user profile",
      );
    } finally {
      // Advance the guard only on success. On failure, scheduleRetry() above
      // will call fetchProfileData() again after the back-off delay, keeping
      // isLoading = true during the wait.
      if (fetchSucceeded && isCurrentRequest()) {
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

  const profileBelongsToCurrentUser =
    isAuthenticated &&
    !!CURRENT_USER_ID &&
    profileOwnerIdRef.current === CURRENT_USER_ID &&
    String(userProfile.id || "").trim() === CURRENT_USER_ID;
  const scopedUserProfile = profileBelongsToCurrentUser
    ? userProfile
    : createProfileForAuthUser(isAuthenticated ? user : null);

  const isProfileComplete = Boolean(
    scopedUserProfile.phone &&
    (
      (scopedUserProfile.city && scopedUserProfile.area) ||
      (
        Number.isInteger(scopedUserProfile.cityId) &&
        Number(scopedUserProfile.cityId) > 0 &&
        Number.isInteger(scopedUserProfile.areaId) &&
        Number(scopedUserProfile.areaId) > 0
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
    setProfileError(null);
    return fetchProfileData();
  }, [fetchProfileData]);

  return {
    userProfile: scopedUserProfile,
    setUserProfile,
    currentUserDisplayName: CURRENT_USER_DISPLAY_NAME,
    isLoading: isLoading || pendingFetchForNewUser,
    isProfileComplete,
    profileError,
    refreshProfile,
    isCurrentProfileOwner,
  };
}

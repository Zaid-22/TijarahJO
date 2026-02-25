import { useCallback, useEffect, useRef, useState } from "react";
import { AuthState, User } from "../types";
import { api } from "../services/api";
import {
  resolveUserFromAuthPayload,
  shouldClearTokenForAuthError,
} from "./authUtils";
import {
  AUTH_ERROR_EMIT_COOLDOWN_MS,
  getNetworkRetryDelayMs,
  getNextConsecutiveNetworkFailures,
  OFFLINE_SESSION_MESSAGE,
  shouldEmitAuthError,
} from "./authRuntimePolicy";
import {
  AUTH_GUEST_KEY,
  AUTH_LEGACY_KEYS,
  AuthFallbackUser,
  BACKEND_UNAVAILABLE_MESSAGE,
  CurrentUserResult,
  debugAuthError,
  debugAuthLog,
  debugAuthWarn,
  getErrorMessage,
  isRetryableAuthError,
  normalizeMessage,
  pause,
  SESSION_EXPIRED_MESSAGE,
} from "./authContextUtils";
import { performAuthLogin, performAuthRegister } from "./authActions";
import { useAuthEventSync } from "./useAuthEventSync";
import { AuthContextType } from "./authContextTypes";

export function useAuthProviderController(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authCheckRunIdRef = useRef(0);
  const authCheckInitializedRef = useRef(false);
  const lastRevalidateAtRef = useRef(0);
  const consecutiveNetworkFailuresRef = useRef(0);
  const didInitialAuthCheckRef = useRef(false);
  const lastAuthErrorEmissionRef = useRef<{
    message: string;
    emittedAt: number;
  }>({ message: "", emittedAt: 0 });

  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem(AUTH_GUEST_KEY);
    for (const key of AUTH_LEGACY_KEYS) {
      localStorage.removeItem(key);
    }
  }, []);

  const setSignedOutState = useCallback((message?: string) => {
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
    setIsGuest(false);
    if (message) {
      setAuthError(message);
    } else {
      setAuthError(null);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const emitAuthError = useCallback((message: string) => {
    const normalizedMessage = normalizeMessage(
      message,
      BACKEND_UNAVAILABLE_MESSAGE,
    );
    const now = Date.now();
    const previous = lastAuthErrorEmissionRef.current;
    if (
      !shouldEmitAuthError(
        previous,
        normalizedMessage,
        now,
        AUTH_ERROR_EMIT_COOLDOWN_MS,
      )
    ) {
      return;
    }

    lastAuthErrorEmissionRef.current = {
      message: normalizedMessage,
      emittedAt: now,
    };
    setAuthError(normalizedMessage);
  }, []);

  const resolveAuthUser = useCallback(
    (payload: unknown, fallback: AuthFallbackUser): User =>
      resolveUserFromAuthPayload(payload, {
        email: fallback.email,
        firstName: fallback.firstName || "",
        lastName: fallback.lastName || "",
        name: fallback.name || fallback.email,
        role: fallback.role || "user",
        id: fallback.id || "",
        avatar: fallback.avatar,
      }),
    [],
  );

  const persistAuthenticatedSession = useCallback((user: User) => {
    localStorage.removeItem(AUTH_GUEST_KEY);
    setIsGuest(false);
    setAuthError(null);
    setAuthState({
      isAuthenticated: true,
      user,
    });
  }, []);

  const fetchCurrentUser = useCallback(
    async (fallbackEmail = ""): Promise<CurrentUserResult> => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return {
          status: "network_error",
          message: OFFLINE_SESSION_MESSAGE,
        };
      }

      try {
        const response = await api.auth.getCurrentUser();
        if (response.success && response.data) {
          return {
            status: "success",
            user: resolveAuthUser(response.data, {
              email: fallbackEmail,
              name: fallbackEmail,
              role: "user",
            }),
          };
        }

        if (!response.success) {
          if (isRetryableAuthError(response.error)) {
            return {
              status: "network_error",
              message: normalizeMessage(
                response.error?.message,
                BACKEND_UNAVAILABLE_MESSAGE,
              ),
            };
          }

          return {
            status: "auth_error",
            message: normalizeMessage(
              response.error?.message,
              SESSION_EXPIRED_MESSAGE,
            ),
          };
        }

        return {
          status: "auth_error",
          message: SESSION_EXPIRED_MESSAGE,
        };
      } catch (error) {
        if (shouldClearTokenForAuthError(error)) {
          return {
            status: "auth_error",
            message: normalizeMessage(
              getErrorMessage(error),
              SESSION_EXPIRED_MESSAGE,
            ),
          };
        }

        return {
          status: "network_error",
          message: normalizeMessage(
            getErrorMessage(error),
            BACKEND_UNAVAILABLE_MESSAGE,
          ),
        };
      }
    },
    [resolveAuthUser],
  );

  const hydrateAuthenticatedUser = useCallback(
    async (
      candidateUser: User,
      fallbackEmail: string,
      source: "login" | "signup",
    ): Promise<{ user: User; shouldAbort: boolean }> => {
      const needsUserHydration =
        !String(candidateUser.id || "").trim() ||
        (!String(candidateUser.firstName || "").trim() &&
          !String(candidateUser.lastName || "").trim());

      if (!needsUserHydration) {
        return { user: candidateUser, shouldAbort: false };
      }

      const currentUserResult = await fetchCurrentUser(
        candidateUser.email || fallbackEmail,
      );

      if (currentUserResult.status === "success") {
        return { user: currentUserResult.user, shouldAbort: false };
      }

      if (currentUserResult.status === "network_error") {
        setAuthError(currentUserResult.message);
        return { user: candidateUser, shouldAbort: false };
      }

      const authMessage = normalizeMessage(
        currentUserResult.message,
        SESSION_EXPIRED_MESSAGE,
      );
      debugAuthWarn(
        `[AuthContext] ${source} succeeded but session hydration failed:`,
        authMessage,
      );
      clearAuthStorage();
      setSignedOutState(authMessage);
      return { user: candidateUser, shouldAbort: true };
    },
    [clearAuthStorage, fetchCurrentUser, setSignedOutState],
  );

  const checkAuth = useCallback(async () => {
    const runId = ++authCheckRunIdRef.current;
    const isLatestRun = () => runId === authCheckRunIdRef.current;

    if (!authCheckInitializedRef.current) {
      setLoading(true);
    }

    const guestMode = localStorage.getItem(AUTH_GUEST_KEY);

    let currentUserResult = await fetchCurrentUser(authState.user?.email || "");
    if (currentUserResult.status === "network_error") {
      const retryDelayMs = getNetworkRetryDelayMs(
        consecutiveNetworkFailuresRef.current,
      );
      await pause(retryDelayMs);
      currentUserResult = await fetchCurrentUser(authState.user?.email || "");
    }

    if (!isLatestRun()) {
      return;
    }

    if (currentUserResult.status === "success") {
      consecutiveNetworkFailuresRef.current = 0;
      if (guestMode === "true") {
        localStorage.removeItem(AUTH_GUEST_KEY);
      }
      setIsGuest(false);
      setAuthState({
        isAuthenticated: true,
        user: currentUserResult.user,
      });
      setAuthError(null);
      debugAuthLog(
        "[AuthContext] checkAuth successful, user authenticated:",
        currentUserResult.user.id,
        "Role:",
        currentUserResult.user.role,
      );
    } else if (guestMode === "true") {
      consecutiveNetworkFailuresRef.current = 0;
      setIsGuest(true);
      setAuthState({
        isAuthenticated: true,
        user: null,
      });
      setAuthError(null);
    } else if (currentUserResult.status === "auth_error") {
      consecutiveNetworkFailuresRef.current = 0;
      debugAuthWarn("[AuthContext] No valid authenticated session");

      const wasAuthenticated =
        authState.isAuthenticated ||
        AUTH_LEGACY_KEYS.some((k) => localStorage.getItem(k) !== null);

      clearAuthStorage();

      if (wasAuthenticated) {
        setSignedOutState(currentUserResult.message);
      } else {
        setSignedOutState();
      }
    } else {
      consecutiveNetworkFailuresRef.current = getNextConsecutiveNetworkFailures(
        consecutiveNetworkFailuresRef.current,
        "network_error",
      );
      debugAuthWarn("[AuthContext] Backend unavailable during auth check");
      emitAuthError(currentUserResult.message);
      setAuthState((prev) => {
        if (prev.isAuthenticated && prev.user) {
          return prev;
        }

        return {
          isAuthenticated: false,
          user: null,
        };
      });
    }

    authCheckInitializedRef.current = true;
    if (isLatestRun()) {
      setLoading(false);
    }
  }, [
    authState.isAuthenticated,
    authState.user?.email,
    clearAuthStorage,
    emitAuthError,
    fetchCurrentUser,
    setSignedOutState,
  ]);

  useEffect(() => {
    if (didInitialAuthCheckRef.current) {
      return;
    }
    didInitialAuthCheckRef.current = true;
    void checkAuth();
  }, [checkAuth]);

  useAuthEventSync({
    checkAuth,
    emitAuthError,
    consecutiveNetworkFailuresRef,
    lastRevalidateAtRef,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      return performAuthLogin({
        email,
        password,
        resolveAuthUser,
        hydrateAuthenticatedUser,
        persistAuthenticatedSession,
        setAuthError,
        getErrorMessage,
      });
    },
    [hydrateAuthenticatedUser, persistAuthenticatedSession, resolveAuthUser],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      phone: string,
      city: string,
      area: string,
    ): Promise<boolean> => {
      return performAuthRegister({
        email,
        password,
        name,
        phone,
        city,
        area,
        resolveAuthUser,
        hydrateAuthenticatedUser,
        persistAuthenticatedSession,
        setAuthError,
        getErrorMessage,
      });
    },
    [hydrateAuthenticatedUser, persistAuthenticatedSession, resolveAuthUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      debugAuthError("Logout error:", error);
    } finally {
      clearAuthStorage();
      setSignedOutState();
      window.dispatchEvent(new CustomEvent("authSessionChanged"));
    }
  }, [clearAuthStorage, setSignedOutState]);

  const loginAsGuest = useCallback(() => {
    clearAuthStorage();
    localStorage.setItem(AUTH_GUEST_KEY, "true");
    setIsGuest(true);
    setAuthError(null);
    setAuthState({
      isAuthenticated: true,
      user: null,
    });
    window.dispatchEvent(new CustomEvent("authSessionChanged"));
  }, [clearAuthStorage]);

  return {
    ...authState,
    login,
    register,
    logout,
    loginAsGuest,
    checkAuth,
    isGuest,
    loading,
    authError,
    clearAuthError,
  };
}

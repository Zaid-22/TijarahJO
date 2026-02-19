// Authentication Context - Ready for backend integration
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, AuthState } from "../types";
import { api } from "../services/api";
import {
  resolveUserFromAuthPayload,
  shouldClearTokenForAuthError,
} from "./authUtils";
import {
  AUTH_ERROR_EMIT_COOLDOWN_MS,
  canRevalidateSession,
  getNetworkRetryDelayMs,
  getNextConsecutiveNetworkFailures,
  OFFLINE_SESSION_MESSAGE,
  shouldEmitAuthError,
} from "./authRuntimePolicy";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name: string,
    phone: string,
    city: string,
    area: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  checkAuth: () => Promise<void>;
  isGuest: boolean;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEBUG_AUTH =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_AUTH === "true";

const debugAuthLog = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    console.log(...args);
  }
};

const debugAuthWarn = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    console.warn(...args);
  }
};

const debugAuthError = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    console.error(...args);
  }
};

const AUTH_GUEST_KEY = "guestMode";
const AUTH_LEGACY_KEYS = ["tijarahjo_token", "tijarahjo_auth", "tijarahjo_user"];

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";
const BACKEND_UNAVAILABLE_MESSAGE =
  "Cannot verify your session right now. Please check your connection and try again.";

const AUTH_NETWORK_ERROR_CODES = new Set([
  "CONNECTION_REFUSED",
  "TIMEOUT",
  "NETWORK_ERROR",
]);

const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const getErrorMessage = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);

const normalizeMessage = (message: string | undefined, fallback: string): string => {
  const trimmed = message?.trim();
  return trimmed ? trimmed : fallback;
};

const isRetryableAuthError = (error: { code?: string; message?: string } | undefined) => {
  if (!error) {
    return false;
  }

  if (error.code && AUTH_NETWORK_ERROR_CODES.has(error.code)) {
    return true;
  }

  const normalizedMessage = (error.message || "").toLowerCase();
  return (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("connection refused") ||
    normalizedMessage.includes("cannot connect to backend") ||
    normalizedMessage.includes("timed out")
  );
};

type CurrentUserResult =
  | { status: "success"; user: User }
  | { status: "auth_error"; message: string }
  | { status: "network_error"; message: string };

export function AuthProvider({ children }: { children: ReactNode }) {
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
    const normalizedMessage = normalizeMessage(message, BACKEND_UNAVAILABLE_MESSAGE);
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
    (
      payload: unknown,
      fallback: {
        email: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        role?: User["role"];
        id?: string;
        avatar?: string;
      },
    ): User =>
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

  // Memoize checkAuth to prevent unnecessary re-renders.
  const checkAuth = useCallback(async () => {
    const runId = ++authCheckRunIdRef.current;
    const isLatestRun = () => runId === authCheckRunIdRef.current;

    if (!authCheckInitializedRef.current) {
      setLoading(true);
    }

    const guestMode = localStorage.getItem(AUTH_GUEST_KEY);

    // Verify current cookie-backed session with one short retry for transient network errors.
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
      clearAuthStorage();
      setSignedOutState(currentUserResult.message);
    } else {
      consecutiveNetworkFailuresRef.current = getNextConsecutiveNetworkFailures(
        consecutiveNetworkFailuresRef.current,
        "network_error",
      );
      debugAuthWarn(
        "[AuthContext] Backend unavailable during auth check",
      );
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
    authState.user?.email,
    clearAuthStorage,
    emitAuthError,
    fetchCurrentUser,
    setSignedOutState,
  ]);

  // Check for existing session on mount (only once).
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also check auth when auth-related storage changes (cross-tab sync).
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === AUTH_GUEST_KEY ||
        e.key === null ||
        (typeof e.key === "string" && AUTH_LEGACY_KEYS.includes(e.key))
      ) {
        debugAuthLog(
          "[AuthContext] Auth storage changed, refreshing auth state",
        );
        checkAuth();
      }
    };

    // Listen for explicit auth session updates in this tab.
    const handleAuthSessionChanged = () => {
      debugAuthLog("[AuthContext] authSessionChanged event received, checking auth");
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authSessionChanged", handleAuthSessionChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authSessionChanged", handleAuthSessionChanged);
    };
  }, [checkAuth]);

  useEffect(() => {
    const revalidateSession = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        emitAuthError(OFFLINE_SESSION_MESSAGE);
        return;
      }

      const now = Date.now();
      if (
        !canRevalidateSession(
          now,
          lastRevalidateAtRef.current,
          consecutiveNetworkFailuresRef.current,
        )
      ) {
        return;
      }
      lastRevalidateAtRef.current = now;
      void checkAuth();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateSession();
      }
    };

    const handleOnline = () => {
      consecutiveNetworkFailuresRef.current = 0;
      lastRevalidateAtRef.current = 0;
      void checkAuth();
    };

    const handleOffline = () => {
      emitAuthError(OFFLINE_SESSION_MESSAGE);
    };

    window.addEventListener("focus", revalidateSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("focus", revalidateSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkAuth, emitAuthError]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setAuthError(null);
        debugAuthLog("[AuthContext] Attempting login with:", email);
        const response = await api.auth.login({
          email: email,
          password: password,
        });

        debugAuthLog("[AuthContext] Login response:", {
          success: response.success,
          hasUser: !!response.user,
          message: response.message,
          user: response.user,
        });

        // Check if login failed.
        if (!response.success) {
          setAuthError(
            normalizeMessage(
              response.message,
              "Login failed. Please check your credentials and try again.",
            ),
          );
          debugAuthError(
            "[AuthContext] Login failed:",
            response.message || "Unknown error",
          );
          return false;
        }

        let user = resolveAuthUser(response.user, {
          email,
          name: email,
          role: "user",
        });

        const needsUserHydration =
          !String(user.id || "").trim() ||
          (!String(user.firstName || "").trim() &&
            !String(user.lastName || "").trim());

        if (needsUserHydration) {
          const currentUserResult = await fetchCurrentUser(user.email || email);
          if (currentUserResult.status === "success") {
            user = currentUserResult.user;
          } else if (currentUserResult.status === "network_error") {
            setAuthError(currentUserResult.message);
          } else {
            const authMessage = normalizeMessage(
              currentUserResult.message,
              SESSION_EXPIRED_MESSAGE,
            );
            debugAuthWarn(
              "[AuthContext] Login succeeded but session hydration failed:",
              authMessage,
            );
            clearAuthStorage();
            setSignedOutState(authMessage);
            return false;
          }
        }

        persistAuthenticatedSession(user);
        window.dispatchEvent(new CustomEvent("authSessionChanged"));
        debugAuthLog("[AuthContext] Login successful, user set:", user);
        return true;
      } catch (error) {
        debugAuthError("[AuthContext] Login error:", error);
        setAuthError(
          normalizeMessage(getErrorMessage(error), "Login failed. Please try again."),
        );
        return false;
      }
    },
    [
      clearAuthStorage,
      fetchCurrentUser,
      persistAuthenticatedSession,
      resolveAuthUser,
      setSignedOutState,
    ],
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
      try {
        setAuthError(null);
        // Split name into first and last name for fallback user creation.
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Call register API.
        const response: {
          success: boolean;
          data?: {
            success?: boolean;
            user?: unknown;
            message?: string;
          };
          error?: string;
        } = await api.auth.register(
          email,
          password,
          name.trim(),
          phone.trim(),
          city.trim(),
          area.trim(),
        );

        // Check response structure - api.auth.register returns { success, data } where data contains the auth response.
        const authResponse = response.success ? response.data : null;

        if (authResponse && authResponse.success) {
          let transformedUser = resolveAuthUser(authResponse.user, {
            email,
            firstName,
            lastName,
            name: name || email,
            role: "user",
          });

          if (!String(transformedUser.id || "").trim()) {
            const currentUserResult = await fetchCurrentUser(email);
            if (currentUserResult.status === "success") {
              transformedUser = currentUserResult.user;
            } else if (currentUserResult.status === "network_error") {
              setAuthError(currentUserResult.message);
            } else {
              const authMessage = normalizeMessage(
                currentUserResult.message,
                SESSION_EXPIRED_MESSAGE,
              );
              debugAuthWarn(
                "[AuthContext] Signup succeeded but session hydration failed:",
                authMessage,
              );
              clearAuthStorage();
              setSignedOutState(authMessage);
              return false;
            }
          }

          persistAuthenticatedSession(transformedUser);
          window.dispatchEvent(new CustomEvent("authSessionChanged"));
          return true;
        }

        const registerFailureMessage = normalizeMessage(
          authResponse?.message || response.error,
          "Registration failed. Please verify your details and try again.",
        );
        setAuthError(registerFailureMessage);
        debugAuthError(
          "[AuthContext] Register failed:",
          registerFailureMessage,
        );
        return false;
      } catch (error) {
        debugAuthError("Register error:", error);
        setAuthError(
          normalizeMessage(
            getErrorMessage(error),
            "Registration failed. Please try again.",
          ),
        );
        return false;
      }
    },
    [
      clearAuthStorage,
      fetchCurrentUser,
      persistAuthenticatedSession,
      resolveAuthUser,
      setSignedOutState,
    ],
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

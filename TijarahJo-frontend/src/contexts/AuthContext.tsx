// Authentication Context - Ready for backend integration
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, AuthState } from "../types";
import { api } from "../services/api";
import {
  asBackendUser,
  shouldClearTokenForAuthError,
  toUserFromBackend,
} from "./authUtils";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  checkAuth: () => Promise<void>;
  isGuest: boolean;
  loading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize checkAuth to prevent infinite loops
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("tijarahjo_token");
    const guestMode = localStorage.getItem("guestMode");

    // If we have a valid token, clear guestMode (user is authenticated)
    if (token && guestMode === "true") {
      debugAuthLog("[AuthContext] Found token, clearing guestMode");
      localStorage.removeItem("guestMode");
      setIsGuest(false);
    }

    // Only check guestMode if there's no token
    if (!token && guestMode === "true") {
      setIsGuest(true);
      setAuthState({
        isAuthenticated: true,
        user: null,
        token: null,
      });
      setLoading(false);
      return;
    }

    if (token) {
      // Verify token with backend
      try {
        const response = await api.auth.getCurrentUser();

        if (response.success && response.data) {
          // Transform backend UserResponseDTO to frontend User format
          const backendUser = asBackendUser(response.data);
          if (!backendUser) {
            throw new Error("Invalid user payload from /auth/me");
          }
          const user = toUserFromBackend(backendUser);

          setAuthState({
            isAuthenticated: true,
            user,
            token,
          });
          debugAuthLog(
            "[AuthContext] checkAuth successful, user authenticated:",
            user.id,
            "Role:",
            user.role,
          );
        } else {
          // Token is invalid, clear it
          debugAuthWarn(
            "[AuthContext] Token validation failed - response not successful",
          );
          localStorage.removeItem("tijarahjo_token");
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        }
      } catch (error) {
        // If backend is not available or token is invalid, clear auth state
        debugAuthWarn("[AuthContext] checkAuth error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        debugAuthWarn("[AuthContext] Error details:", errorMessage);

        // Only clear token if it's an authentication error (401), not a network error.
        if (shouldClearTokenForAuthError(error)) {
          debugAuthWarn(
            "[AuthContext] Token is invalid (401), clearing auth state",
          );
          localStorage.removeItem("tijarahjo_token");
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        } else {
          // Network error or other issue - keep token but mark as unauthenticated temporarily
          debugAuthWarn(
            "[AuthContext] Network/backend error, keeping token but marking as unauthenticated",
          );
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: token, // Keep token in case backend comes back
          });
        }
      }
    } else {
      // No token found, ensure user is not authenticated
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }

    setLoading(false);
  }, []); // Empty deps - checkAuth doesn't depend on any props/state

  // Check for existing session on mount (only once)
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, checkAuth is stable

  // Also check auth when token changes in localStorage (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tijarahjo_token") {
        debugAuthLog(
          "[AuthContext] Token changed in localStorage, refreshing auth state",
        );
        checkAuth();
      }
    };

    // Also listen for custom authTokenSet event (for same-tab token updates)
    const handleAuthTokenSet = () => {
      debugAuthLog("[AuthContext] authTokenSet event received, checking auth");
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authTokenSet", handleAuthTokenSet);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authTokenSet", handleAuthTokenSet);
    };
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      debugAuthLog("[AuthContext] Attempting login with:", email);
      const response = await api.auth.login({
        email: email,
        password: password,
      });

      debugAuthLog("[AuthContext] Login response:", {
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user,
        message: response.message,
        user: response.user,
      });

      // Check if login failed
      if (!response.success) {
        debugAuthError(
          "[AuthContext] Login failed:",
          response.message || "Unknown error",
        );
        return false;
      }

      if (response.success && response.token) {
        // If user object is provided, use it; otherwise create a minimal user from email
        let user: User;

        if (response.user) {
          const userPayload = asBackendUser(response.user);
          user = userPayload
            ? toUserFromBackend(userPayload, {
                email,
                name: email,
                role: "user",
              })
            : {
                id: "",
                email,
                firstName: "",
                lastName: "",
                name: email,
                role: "user",
              };
        } else {
          // Create minimal user from email if user object is missing
          debugAuthWarn(
            "[AuthContext] No user object in response, creating minimal user from email",
          );

          user = {
            id: "",
            email: email,
            firstName: "",
            lastName: "",
            name: email,
            role: "user",
          };
        }

        localStorage.setItem("tijarahjo_token", response.token);
        localStorage.removeItem("guestMode");
        setIsGuest(false);

        // Fetch full user data from backend when critical identity fields are missing.
        const needsUserHydration =
          !String(user.id || "").trim() ||
          (!String(user.firstName || "").trim() &&
            !String(user.lastName || "").trim());

        if (needsUserHydration) {
          try {
            debugAuthLog(
              "[AuthContext] User object incomplete, fetching full user data...",
            );
            const userResponse = await api.auth.getCurrentUser();
            if (userResponse.success && userResponse.data) {
              const backendUser = asBackendUser(userResponse.data);
              if (!backendUser) {
                throw new Error("Invalid user payload from /auth/me");
              }
              user = toUserFromBackend(backendUser, user);
              debugAuthLog("[AuthContext] Fetched full user data:", user);
            }
          } catch (error) {
            debugAuthWarn(
              "[AuthContext] Failed to fetch full user data after login:",
              error,
            );
            // Continue with the user object from login response
          }
        }

        setAuthState({
          isAuthenticated: true,
          user,
          token: response.token,
        });
        debugAuthLog("[AuthContext] Login successful, user set:", user);
        return true;
      }

      // If we reach here, login failed
      const errorMessage = response.message || "Login failed";
      debugAuthError(
        "[AuthContext] Login failed - success:",
        response.success,
        "hasToken:",
        !!response.token,
        "error:",
        errorMessage,
      );
      return false;
    } catch (error) {
      debugAuthError("[AuthContext] Login error:", error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
  ): Promise<boolean> => {
    try {
      // Split name into first and last name for fallback user creation
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Call register API
      const response: {
        success: boolean;
        data?: {
          success?: boolean;
          token?: string;
          user?: unknown;
          message?: string;
        };
        error?: string;
      } = await api.auth.register(
        email,
        password,
        name.trim(),
        undefined, // phone - optional
        undefined, // city - optional
        undefined, // area - optional
      );

      // Check response structure - api.auth.register returns { success, data } where data contains the auth response
      const authResponse = response.success ? response.data : null;

      if (authResponse && authResponse.success && authResponse.token) {
        // Extract user from authResponse
        const userPayload = asBackendUser(authResponse.user);
        localStorage.setItem("tijarahjo_token", authResponse.token);
        localStorage.removeItem("guestMode");

        // Transform user if available, otherwise create minimal user
        const transformedUser: User = userPayload
          ? toUserFromBackend(userPayload, {
              email,
              firstName,
              lastName,
              name: name || email,
              role: "user",
            })
          : {
              id: "",
              email,
              firstName,
              lastName,
              name: name || email,
              role: "user",
            };

        setAuthState({
          isAuthenticated: true,
          user: transformedUser,
          token: authResponse.token,
        });
        setIsGuest(false);
        return true;
      }

      debugAuthError(
        "[AuthContext] Register failed:",
        authResponse?.message || "Unknown error",
      );
      return false;
    } catch (error) {
      debugAuthError("Register error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      debugAuthError("Logout error:", error);
    } finally {
      localStorage.removeItem("tijarahjo_token");
      localStorage.removeItem("guestMode");
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
      setIsGuest(false);
    }
  };

  const loginAsGuest = () => {
    localStorage.setItem("guestMode", "true");
    localStorage.removeItem("tijarahjo_token");
    setIsGuest(true);
    setAuthState({
      isAuthenticated: true,
      user: null,
      token: null,
    });
  };

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

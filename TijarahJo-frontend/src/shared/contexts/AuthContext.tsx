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

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  isGuest: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    if (guestMode === "true") {
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
          const backendUser = response.data as any; // Type assertion needed for backend response
          const firstName =
            backendUser.FirstName || backendUser.firstName || "";
          const lastName = backendUser.LastName || backendUser.lastName || "";
          const fullName =
            backendUser.Name || `${firstName} ${lastName}`.trim() || "";
          const user: User = {
            id: backendUser.Id?.toString() || backendUser.id || "",
            email: backendUser.Email || backendUser.email || "",
            username: backendUser.Username || backendUser.username || "",
            firstName: firstName,
            lastName: lastName,
            name: fullName,
            avatar: backendUser.Avatar || backendUser.avatar || undefined,
            role: (backendUser.Role || "user") as "user" | "admin",
          };

          setAuthState({
            isAuthenticated: true,
            user,
            token,
          });
          console.log(
            "[AuthContext] checkAuth successful, user authenticated:",
            user.id
          );
        } else {
          // Token is invalid, clear it
          console.warn(
            "[AuthContext] Token validation failed - response not successful"
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
        console.warn("[AuthContext] checkAuth error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn("[AuthContext] Error details:", errorMessage);

        // Only clear token if it's an authentication error (401), not a network error
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
          console.warn(
            "[AuthContext] Token is invalid (401), clearing auth state"
          );
          localStorage.removeItem("tijarahjo_token");
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
          });
        } else {
          // Network error or other issue - keep token but mark as unauthenticated temporarily
          console.warn(
            "[AuthContext] Network/backend error, keeping token but marking as unauthenticated"
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

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Also check auth when token changes in localStorage (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tijarahjo_token") {
        console.log(
          "[AuthContext] Token changed in localStorage, refreshing auth state"
        );
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("[AuthContext] Attempting login with:", email);
      const response = await api.auth.login({
        usernameOrEmail: email,
        password: password,
      });

      console.log("[AuthContext] Login response:", {
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user,
        user: response.user,
      });

      if (response.success && response.token) {
        // If user object is provided, use it; otherwise create a minimal user from email
        let user: User;

        if (response.user) {
          // Ensure user has required properties
          const firstName = response.user.firstName || "";
          const lastName = response.user.lastName || "";
          const fullName =
            (response.user as any).name ||
            `${firstName} ${lastName}`.trim() ||
            response.user.email ||
            "";
          user = {
            id: response.user.id || "",
            email: response.user.email || "",
            username: response.user.username || email.split("@")[0],
            firstName,
            lastName,
            name: fullName,
            role: (response.user as any).role || "user",
          };
        } else {
          // Create minimal user from email if user object is missing
          console.warn(
            "[AuthContext] No user object in response, creating minimal user from email"
          );
          const emailParts = email.split("@");
          user = {
            id: "",
            email: email,
            username: emailParts[0] || email,
            firstName: "",
            lastName: "",
            name: email,
            role: "user",
          };
        }

        localStorage.setItem("tijarahjo_token", response.token);
        localStorage.removeItem("guestMode");
        setAuthState({
          isAuthenticated: true,
          user,
          token: response.token,
        });
        setIsGuest(false);
        console.log("[AuthContext] Login successful, user set:", user);
        return true;
      }

      console.error(
        "[AuthContext] Login failed - success:",
        response.success,
        "hasToken:",
        !!response.token
      );
      return false;
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<boolean> => {
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const response = await api.auth.register(
        email,
        password,
        firstName,
        lastName,
        undefined, // username - will be generated from email
        undefined // phone - optional
      );

      if (response.success && response.token && response.user) {
        localStorage.setItem("tijarahjo_token", response.token);
        localStorage.removeItem("guestMode");
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
        });
        setIsGuest(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
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

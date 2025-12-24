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
  checkAuth: () => Promise<void>;
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

    // If we have a valid token, clear guestMode (user is authenticated)
    if (token && guestMode === "true") {
      console.log("[AuthContext] Found token, clearing guestMode");
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

  // Check for existing session on mount (only once)
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, checkAuth is stable

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
    
    // Also listen for custom authTokenSet event (for same-tab token updates)
    const handleAuthTokenSet = () => {
      console.log("[AuthContext] authTokenSet event received, checking auth");
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
      console.log("[AuthContext] Attempting login with:", email);
      const response = await api.auth.login({
        usernameOrEmail: email,
        password: password,
      });

      console.log("[AuthContext] Login response:", {
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user,
        message: (response as any).message,
        user: response.user,
      });

      // Check if login failed
      if (!response.success) {
        console.error("[AuthContext] Login failed:", (response as any).message || "Unknown error");
        return false;
      }

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
        setIsGuest(false);
        
        // Fetch full user data from backend if user object is incomplete
        if (!user.firstName && !user.lastName && !user.name) {
          try {
            console.log("[AuthContext] User object incomplete, fetching full user data...");
            const userResponse = await api.auth.getCurrentUser();
            if (userResponse.success && userResponse.data) {
              const backendUser = userResponse.data as any;
              const firstName = backendUser.FirstName || backendUser.firstName || "";
              const lastName = backendUser.LastName || backendUser.lastName || "";
              const fullName = backendUser.Name || `${firstName} ${lastName}`.trim() || backendUser.Email || backendUser.email || "";
              
              user = {
                id: (backendUser.Id || backendUser.id || user.id || "").toString(),
                email: backendUser.Email || backendUser.email || user.email || "",
                username: backendUser.Username || backendUser.username || user.username || email.split("@")[0],
                firstName: firstName,
                lastName: lastName,
                name: fullName,
                avatar: backendUser.Avatar || backendUser.avatar || user.avatar || undefined,
                role: (backendUser.Role || user.role || "user") as "user" | "admin",
              };
              console.log("[AuthContext] Fetched full user data:", user);
            }
          } catch (error) {
            console.warn("[AuthContext] Failed to fetch full user data after login:", error);
            // Continue with the user object from login response
          }
        }
        
        setAuthState({
          isAuthenticated: true,
          user,
          token: response.token,
        });
        console.log("[AuthContext] Login successful, user set:", user);
        return true;
      }

      // If we reach here, login failed
      const errorMessage = (response as any).message || "Login failed";
      console.error(
        "[AuthContext] Login failed - success:",
        response.success,
        "hasToken:",
        !!response.token,
        "error:",
        errorMessage
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

      // Call register API - note: api.auth.register expects (email, password, name, username?, phone?, city?, area?)
      const name = `${firstName} ${lastName}`.trim();
      const response = await api.auth.register(
        email,
        password,
        name,
        undefined, // username - will be generated from email
        undefined, // phone - optional
        undefined, // city - optional
        undefined // area - optional
      );

      // Check response structure - api.auth.register returns { success, data } where data contains the auth response
      const authResponse = response.success ? (response as any).data : null;
      
      if (authResponse && authResponse.success && authResponse.token) {
        // Extract user from authResponse
        const user = authResponse.user || null;
        localStorage.setItem("tijarahjo_token", authResponse.token);
        localStorage.removeItem("guestMode");
        
        // Transform user if available, otherwise create minimal user
        let transformedUser: User;
        if (user) {
          transformedUser = {
            id: user.id || user.Id || "",
            email: user.email || user.Email || email,
            username: user.username || user.Username || email.split("@")[0],
            firstName: user.firstName || user.FirstName || firstName,
            lastName: user.lastName || user.LastName || lastName,
            name: user.name || `${user.firstName || user.FirstName || firstName} ${user.lastName || user.LastName || lastName}`.trim() || email,
            role: (user.role || user.Role || "user") as "user" | "admin",
            avatar: user.avatar || user.Avatar || undefined,
          };
        } else {
          // Create minimal user if not provided
          transformedUser = {
            id: "",
            email: email,
            username: email.split("@")[0],
            firstName: firstName,
            lastName: lastName,
            name: name || email,
            role: "user",
          };
        }
        
        setAuthState({
          isAuthenticated: true,
          user: transformedUser,
          token: authResponse.token,
        });
        setIsGuest(false);
        return true;
      }

      console.error("[AuthContext] Register failed:", (authResponse as any)?.message || "Unknown error");
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

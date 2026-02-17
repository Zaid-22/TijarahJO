import { APP_CONFIG } from "../../constants/appConfig";
import {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
} from "../../types/api";
import { normalizeJordanPhone } from "../../utils/phone";
import {
  apiRequest,
  BACKEND_CONNECTION_SHORT_MESSAGE,
  debugError,
  debugLog,
  debugWarn,
} from "./client";
import { toIsoStringOrNow } from "./shared";

function normalizeLoginIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalizedPhone = normalizeJordanPhone(trimmed);
  if (normalizedPhone) {
    return normalizedPhone;
  }

  return trimmed.toLowerCase();
}

// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Login user with email/phone and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Real API call - map frontend format to backend format
    const response = await apiRequest<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        Login: normalizeLoginIdentifier(credentials.email),
        Password: credentials.password,
      }),
    });

    // Debug logging
    debugLog("Login API response:", JSON.stringify(response, null, 2));
    debugLog("Response success:", response.success);
    if (response.success) {
      debugLog("Response data:", JSON.stringify(response.data, null, 2));
      debugLog("Response data type:", typeof response.data);
      debugLog(
        "Response data keys:",
        response.data ? Object.keys(response.data) : "null",
      );
    } else {
      debugLog("Response error:", response.error);
    }

    if (response.success && response.data) {
      // Map backend response to frontend format
      const backendResponse = response.data;
      debugLog("Backend response structure:", {
        hasSuccess: "Success" in backendResponse,
        hasToken: "Token" in backendResponse,
        hasUser: "User" in backendResponse,
        Success: backendResponse.Success,
        Token: backendResponse.Token ? "exists" : "missing",
        User: backendResponse.User ? "exists" : "missing",
      });

      // Check if backend returned an error in the data (AuthResponse with Success: false)
      // This can happen with 401 Unauthorized or 400 BadRequest where backend returns 200 OK but Success: false
      if (backendResponse.Success === false) {
        const errorMessage =
          backendResponse.Message || "Login failed. Please try again.";
        debugLog("Backend returned error in data:", errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: {
            code: "LOGIN_FAILED",
            message: errorMessage,
          },
        } as any;
      }

      // If Success is true (or not explicitly false) and Token exists, proceed
      if (backendResponse.Success !== false && backendResponse.Token) {
        localStorage.setItem("tijarahjo_token", backendResponse.Token);
        debugLog("Token saved to localStorage");

        // Transform backend UserResponseDTO to frontend User format
        if (backendResponse.User) {
          const user = backendResponse.User;
          debugLog(
            "User object from backend:",
            JSON.stringify(user, null, 2),
          );
          const transformedUser = {
            id: (user.Id || user.id || "").toString(),
            firstName: user.FirstName || user.firstName || "",
            lastName: user.LastName || user.lastName || "",
            email: user.Email || user.email || "",
            phone: user.Phone || user.phone || "",
            city: user.City || user.city || "",
            area: user.Area || user.area || "",
            bio: user.Bio || user.bio || "",
            avatar: user.Avatar || user.avatar || undefined,
            joinedDate: toIsoStringOrNow(user.JoinedDate ?? user.joinedDate),
            createdAt: toIsoStringOrNow(user.JoinedDate ?? user.joinedDate),
            updatedAt: new Date().toISOString(),
            roleID: user.RoleID ?? user.roleID ?? 2,
            isDeleted: Boolean(user.IsDeleted ?? user.isDeleted ?? false),
          };
          debugLog("Transformed user:", transformedUser);
          return {
            success: true,
            token: backendResponse.Token,
            user: transformedUser,
          } as any;
        } else {
          debugWarn(
            "No User object in backend response, but Success is true and Token exists",
          );
          // Return success with token, user data will be fetched separately
          return {
            success: true,
            token: backendResponse.Token,
            message: backendResponse.Message || "Login successful",
          } as any;
        }
      }

      // If we reach here, something is wrong with the response
      debugError("Invalid response structure:", backendResponse);
      return {
        success: false,
        message:
          backendResponse.Message ||
          "Login failed. Invalid response from server.",
        error: {
          code: "INVALID_RESPONSE",
          message: "Invalid response structure from server",
        },
      } as any;
    }

    // If we get here, response.success is false or response.data is missing
    debugError(
      "Login failed - response.success:",
      response.success,
      "response:",
      response,
    );

    // Extract error message from response
    let errorMessage = "Login failed. Please try again.";

    // When backend returns error, check multiple places for the error message
    if (!response.success) {
      // Check response.error.details (AuthResponse object from backend)
      if (response.error && response.error.details) {
        const details = response.error.details as any;
        if (details.Success === false && details.Message) {
          errorMessage = details.Message;
          debugLog("Found error in AuthResponse:", errorMessage);
        } else if (details.Message) {
          errorMessage = details.Message;
          debugLog(
            "Found error message in response.error.details.Message:",
            errorMessage,
          );
        } else if (details.message) {
          errorMessage = details.message;
          debugLog(
            "Found error message in response.error.details.message:",
            errorMessage,
          );
        }
      }

      // If no message in details, use the error message from apiRequest
      if (
        errorMessage === "Login failed. Please try again." &&
        response.error &&
        response.error.message
      ) {
        errorMessage = response.error.message;
        debugLog("Using response.error.message:", errorMessage);
      }

      // Connection errors
      if (response.error && response.error.code === "CONNECTION_REFUSED") {
        errorMessage = BACKEND_CONNECTION_SHORT_MESSAGE;
      }
    } else if (response.success && response.data) {
      // Check if data contains error (backend returned 200 OK but Success: false)
      const data = response.data as any;
      if (data.Success === false && data.Message) {
        errorMessage = data.Message;
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: {
        code: "LOGIN_FAILED",
        message: errorMessage,
      },
    } as any;
  },

  /**
   * Sign up new user
   */
  signup: async (userData: SignUpRequest): Promise<AuthResponse> => {
    // Real API call - map frontend format to backend format
    const response = await apiRequest<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        Email: userData.email?.trim() || null,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName || "",
        Phone: normalizeJordanPhone(userData.phone || "") || null,
        City: userData.city || null,
        Area: userData.area || null,
      }),
    });

    // Debug logging
    debugLog("Signup API response:", response);
    debugLog("Response success:", response.success);
    if (response.success) {
      debugLog("Response data:", response.data);
    } else {
      debugLog("Response error:", response.error);
    }

    if (response.success && response.data) {
      // Map backend response to frontend format
      const backendResponse = response.data;

      // Check if backend returned an error in the data (AuthResponse with Success: false)
      // This can happen if backend returns 201 Created but with Success: false in body
      if (backendResponse.Success === false) {
        const errorMessage =
          backendResponse.Message || "Registration failed. Please try again.";
        debugLog("Backend returned error in data:", errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: {
            code: "SIGNUP_FAILED",
            message: errorMessage,
          },
        } as any;
      }

      // If Success is true (or not explicitly false) and Token exists, proceed
      if (backendResponse.Success !== false && backendResponse.Token) {
        localStorage.setItem("tijarahjo_token", backendResponse.Token);

        // Transform backend UserResponseDTO to frontend User format
        if (backendResponse.User) {
          const user = backendResponse.User;
          return {
            success: true,
            token: backendResponse.Token,
            user: {
              id: (user.Id || user.id || "").toString(),
              firstName: user.FirstName || user.firstName || "",
              lastName: user.LastName || user.lastName || "",
              email: user.Email || user.email || "",
              phone: user.Phone || user.phone || "",
              city: user.City || user.city || "",
              area: user.Area || user.area || "",
              bio: user.Bio || user.bio || "",
              avatar: user.Avatar || user.avatar || undefined,
              joinedDate: toIsoStringOrNow(user.JoinedDate ?? user.joinedDate),
              createdAt: toIsoStringOrNow(user.JoinedDate ?? user.joinedDate),
              updatedAt: new Date().toISOString(),
              roleID: user.RoleID ?? user.roleID ?? 2,
              isDeleted: Boolean(user.IsDeleted ?? user.isDeleted ?? false),
            },
          } as any;
        } else {
          // Token exists but no user object - return success with token
          return {
            success: true,
            token: backendResponse.Token,
            message: backendResponse.Message || "Registration successful",
          } as any;
        }
      }

      // If we reach here, something is wrong with the response
      debugError("Invalid signup response structure:", backendResponse);
      return {
        success: false,
        message:
          backendResponse.Message ||
          "Registration failed. Invalid response from server.",
        error: {
          code: "INVALID_RESPONSE",
          message: "Invalid response structure from server",
        },
      } as any;
    }

    // Extract error message from response
    let errorMessage = "Registration failed. Please try again.";

    // When backend returns error, check multiple places for the error message
    if (!response.success) {
      // Check response.error.details (AuthResponse object from backend)
      if (response.error && response.error.details) {
        const details = response.error.details as any;
        if (details.Success === false && details.Message) {
          errorMessage = details.Message;
          debugLog("Found error in AuthResponse:", errorMessage);
        } else if (details.Message) {
          errorMessage = details.Message;
          debugLog(
            "Found error message in response.error.details.Message:",
            errorMessage,
          );
        } else if (details.message) {
          errorMessage = details.message;
          debugLog(
            "Found error message in response.error.details.message:",
            errorMessage,
          );
        }
      }

      // If no message in details, use the error message from apiRequest
      if (
        errorMessage === "Registration failed. Please try again." &&
        response.error &&
        response.error.message
      ) {
        const errorStr = response.error.message;
        debugLog("Using response.error.message:", errorStr);

        // Check for unique constraint violations in the error message
        if (
          errorStr.includes("UNIQUE KEY constraint") ||
          errorStr.includes("UQ_TbUsers")
        ) {
          if (
            errorStr.includes("UQ_TbUsers_E") ||
            errorStr.includes("UQ_TbUsers_Email") ||
            errorStr.includes("Email")
          ) {
            errorMessage =
              "An account with this email address already exists. Please use a different email or try logging in.";
          } else {
            errorMessage =
              "An account with this information already exists. Please check your details and try again.";
          }
        } else {
          errorMessage = errorStr;
        }
      }
      // Connection errors
      if (response.error && response.error.code === "CONNECTION_REFUSED") {
        errorMessage = BACKEND_CONNECTION_SHORT_MESSAGE;
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: {
        code: "SIGNUP_FAILED",
        message: errorMessage,
      },
    } as any;
  },

  /**
   * Register new user (alias for signup, legacy compatibility)
   */
  register: async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    city?: string,
    area?: string,
  ): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
    // Split name into first and last name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

    const userData: SignUpRequest = {
      email: email.trim(),
      password: password,
      firstName: firstName,
      lastName: lastName,
      phone: phone || "",
      city: city || APP_CONFIG.defaultCity,
      area: area || "",
    };

    // Use signup function
    const result = await authApi.signup(userData);

    if (result.success) {
      return { success: true, data: result };
    }

    return {
      success: false,
      error: result.message,
    };
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      // Logout endpoint might return 404 if not implemented, that's okay
      // We'll still clear the token client-side
      debugLog("[API] Logout endpoint call failed (this is okay):", error);
    }
    localStorage.removeItem("tijarahjo_token");
    localStorage.removeItem("tijarahjo_auth");
    localStorage.removeItem("tijarahjo_user");
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    return await apiRequest("/auth/me", { method: "GET" });
  },
};

// ============================================================================

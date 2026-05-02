import type { ApiResponse, LoginRequest, SignUpRequest } from "../../types/api";
import { APP_CONFIG } from "../../constants/appConfig";
import { normalizeJordanPhone } from "../../utils/phone";
import { apiRequest, debugError, debugLog } from "./client";
import { type UnknownRecord } from "./normalizers";
import { resolveCityId, resolveAreaId } from "./posts/lookups";
import {
  type AuthApiResponse,
  type TwoFactorSetupStartApiResponse,
  type TwoFactorStatusApiResponse,
  handleAuthSuccessPayload,
  normalizeLoginIdentifier,
  parseTwoFactorSetupStartPayload,
  parseTwoFactorStatusPayload,
  resolveAuthFailureMessage,
  resolveMessageFromPayload,
  toAuthFailure,
} from "./authHelpers";

function normalizeLocalGoogleAuthBackendHost(rawBackendHost: string): string {
  if (!rawBackendHost) {
    return rawBackendHost;
  }

  try {
    const parsed = new URL(rawBackendHost);

    // Google OAuth state/nonce cookies are host-bound. The backend callback is
    // configured for localhost in local development, so normalize loopback auth
    // starts to localhost as well and avoid 127.0.0.1/localhost cookie splits.
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "::1") {
      parsed.hostname = "localhost";
    }

    return parsed.origin;
  } catch {
    return rawBackendHost;
  }
}

function buildGoogleAuthStartUrl(mode: "login" | "signup"): string {
  const normalizedMode = mode === "signup" ? "signup" : "login";
  const backendHost = normalizeLocalGoogleAuthBackendHost(
    APP_CONFIG.backendHostUrl.replace(/\/+$/, ""),
  );
  const path = `/api/v1/auth/google/start?mode=${encodeURIComponent(
    normalizedMode,
  )}`;

  if (!backendHost) {
    return path;
  }

  return `${backendHost}${path}`;
}

// Authentication API
// ============================================================================
export const authApi = {
  /**
   * Build Google OAuth start URL (backend redirect flow)
   */
  getGoogleAuthStartUrl: (mode: "login" | "signup" = "login"): string => {
    return buildGoogleAuthStartUrl(mode);
  },

  /**
   * Login user with email/phone and password
   */
  login: async (credentials: LoginRequest): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        Login: normalizeLoginIdentifier(credentials.email),
        Password: credentials.password,
      }),
    });

    debugLog("Login API response: success=", response.success);
    if (!response.success) {
      debugLog("Response error:", response.error);
    }

    if (response.success && response.data) {
      return handleAuthSuccessPayload(
        response.data,
        "LOGIN_FAILED",
        "Login failed. Please try again.",
        "Login successful",
      );
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Login failed. Please try again.",
    );

    debugError(
      "Login failed - response.success:",
      response.success,
      "response:",
      response,
    );

    return toAuthFailure("LOGIN_FAILED", errorMessage);
  },

  verifyTwoFactorLogin: async (
    twoFactorToken: string,
    code: string,
  ): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/verify-login", {
      method: "POST",
      body: JSON.stringify({
        TwoFactorToken: twoFactorToken.trim(),
        Code: code.trim(),
      }),
    });

    if (response.success && response.data) {
      return handleAuthSuccessPayload(
        response.data,
        "TWO_FACTOR_VERIFY_FAILED",
        "Two-factor verification failed. Please try again.",
        "Two-factor verification successful",
      );
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Two-factor verification failed. Please try again.",
    );
    return toAuthFailure("TWO_FACTOR_VERIFY_FAILED", errorMessage);
  },

  getTwoFactorStatus: async (): Promise<TwoFactorStatusApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/status", {
      method: "GET",
    });

    if (response.success) {
      return parseTwoFactorStatusPayload(response.data);
    }

    return {
      success: false,
      enabled: false,
      hasPendingSetup: false,
      message: resolveAuthFailureMessage(
        response,
        "Failed to load two-factor status.",
      ),
    };
  },

  getTwoFactorChallenge: async (): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/challenge", {
      method: "GET",
    });

    if (response.success && response.data) {
      return handleAuthSuccessPayload(
        response.data,
        "TWO_FACTOR_CHALLENGE_FAILED",
        "Failed to retrieve two-factor challenge.",
        "Two-factor verification is required.",
      );
    }

    return toAuthFailure(
      "TWO_FACTOR_CHALLENGE_FAILED",
      resolveAuthFailureMessage(
        response,
        "Failed to retrieve two-factor challenge.",
      ),
    );
  },

  startTwoFactorSetup: async (): Promise<TwoFactorSetupStartApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/setup/start", {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (response.success) {
      return parseTwoFactorSetupStartPayload(response.data);
    }

    return {
      success: false,
      message: resolveAuthFailureMessage(
        response,
        "Failed to start two-factor setup.",
      ),
    };
  },

  confirmTwoFactorSetup: async (code: string): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/setup/confirm", {
      method: "POST",
      body: JSON.stringify({
        Code: code.trim(),
      }),
    });

    if (response.success) {
      return {
        success: true,
        message: resolveMessageFromPayload(
          response.data,
          "Two-factor authentication enabled.",
        ),
      };
    }

    return toAuthFailure(
      "TWO_FACTOR_SETUP_CONFIRM_FAILED",
      resolveAuthFailureMessage(
        response,
        "Failed to enable two-factor authentication.",
      ),
    );
  },

  disableTwoFactor: async (code: string): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({
        Code: code.trim(),
      }),
    });

    if (response.success) {
      return {
        success: true,
        message: resolveMessageFromPayload(
          response.data,
          "Two-factor authentication disabled.",
        ),
      };
    }

    return toAuthFailure(
      "TWO_FACTOR_DISABLE_FAILED",
      resolveAuthFailureMessage(
        response,
        "Failed to disable two-factor authentication.",
      ),
    );
  },

  /**
   * Sign up new user
   */
  signup: async (userData: SignUpRequest): Promise<AuthApiResponse> => {
    const normalizedPhone = normalizeJordanPhone(userData.phone || "");
    const normalizedCity = (userData.city || "").trim();
    const normalizedArea = (userData.area || "").trim();
    const normalizedBio = (userData.bio || "").trim();
    const normalizedAvatar = (userData.avatar || "").trim();

    if (!normalizedPhone) {
      return toAuthFailure(
        "VALIDATION_ERROR",
        "Phone number is required and must be a valid Jordanian number.",
      );
    }

    if (!normalizedCity) {
      return toAuthFailure("VALIDATION_ERROR", "City is required.");
    }

    if (!normalizedArea) {
      return toAuthFailure("VALIDATION_ERROR", "Area is required.");
    }

    const cityId = await resolveCityId(normalizedCity);
    if (cityId === undefined || cityId === null) {
      return toAuthFailure(
        "VALIDATION_ERROR",
        `Could not resolve city "${normalizedCity}". Please select a valid city.`,
      );
    }

    const areaId = await resolveAreaId(cityId, normalizedArea);
    if (areaId === undefined || areaId === null) {
      return toAuthFailure(
        "VALIDATION_ERROR",
        `Could not resolve area "${normalizedArea}" in the selected city. Please select a valid area.`,
      );
    }

    const response = await apiRequest<unknown>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        Email: userData.email?.trim() || null,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName || "",
        Phone: normalizedPhone,
        CityId: cityId,
        AreaId: areaId,
        Bio: normalizedBio || null,
        Avatar: normalizedAvatar || null,
      }),
    });

    debugLog("Signup API response: success=", response.success);
    if (!response.success) {
      debugLog("Response error:", response.error);
    }

    if (response.success && response.data) {
      return handleAuthSuccessPayload(
        response.data,
        "SIGNUP_FAILED",
        "Registration failed. Please try again.",
        "Registration successful",
      );
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Registration failed. Please try again.",
      true,
    );

    return toAuthFailure("SIGNUP_FAILED", errorMessage);
  },

  /**
   * Register new user (alias for signup, legacy compatibility)
   */
  register: async (
    email: string,
    password: string,
    name: string,
    phone: string,
    city: string,
    area: string,
  ): Promise<{ success: boolean; data?: AuthApiResponse; error?: string }> => {
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

    const userData: SignUpRequest = {
      email: email.trim(),
      password,
      firstName,
      lastName,
      phone: phone.trim(),
      city: city.trim(),
      area: area.trim(),
    };

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
   * Request an email verification code for password reset
   */
  requestPasswordReset: async (email: string): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>(
      "/auth/forgot-password/request",
      {
        method: "POST",
        body: JSON.stringify({
          Email: email.trim().toLowerCase(),
        }),
      },
    );

    if (response.success) {
      return {
        success: true,
        message: resolveMessageFromPayload(
          response.data,
          "A verification code has been sent to your email.",
        ),
      };
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Unable to process password reset request.",
    );
    return toAuthFailure("PASSWORD_RESET_REQUEST_FAILED", errorMessage);
  },

  /**
   * Verify a password reset email code before collecting a new password
   */
  verifyPasswordResetCode: async (
    email: string,
    code: string,
  ): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>(
      "/auth/forgot-password/verify",
      {
        method: "POST",
        body: JSON.stringify({
          Email: email.trim().toLowerCase(),
          Code: code.trim(),
        }),
      },
    );

    if (response.success) {
      return {
        success: true,
        message: resolveMessageFromPayload(
          response.data,
          "Verification code confirmed.",
        ),
      };
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Invalid or expired verification code.",
    );
    return toAuthFailure("PASSWORD_RESET_VERIFY_FAILED", errorMessage);
  },

  /**
   * Confirm password reset with email code and new password
   */
  confirmPasswordReset: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<AuthApiResponse> => {
    const response = await apiRequest<unknown>(
      "/auth/forgot-password/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          Email: email.trim().toLowerCase(),
          Code: code.trim(),
          NewPassword: newPassword,
        }),
      },
    );

    if (response.success) {
      return {
        success: true,
        message: resolveMessageFromPayload(
          response.data,
          "Password reset succeeded.",
        ),
      };
    }

    const errorMessage = resolveAuthFailureMessage(
      response,
      "Unable to reset password. Please check your code and try again.",
    );
    return toAuthFailure("PASSWORD_RESET_CONFIRM_FAILED", errorMessage);
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      // Logout endpoint may fail on some environments; local session state is still cleared by callers.
      debugLog("[API] Logout endpoint call failed (this is okay):", error);
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<UnknownRecord>> => {
    return await apiRequest<UnknownRecord>("/auth/me", { method: "GET" });
  },
};

// ============================================================================

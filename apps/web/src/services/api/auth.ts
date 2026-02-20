import type {
  ApiResponse,
  LoginRequest,
  SignUpRequest,
  User as ApiUser,
} from "../../types/api";
import { normalizeJordanPhone } from "../../utils/phone";
import {
  apiRequest,
  BACKEND_CONNECTION_SHORT_MESSAGE,
  debugError,
  debugLog,
} from "./client";
import { asRecord, readString, type UnknownRecord } from "./normalizers";
import { parseAuthEnvelope, ParsedAuthUser } from "./schemas/authSchema";

type AuthApiError = {
  code: string;
  message: string;
};

type AuthApiUser = ApiUser & {
  roleID?: number;
  isDeleted?: boolean;
};

type AuthApiResponse = {
  success: boolean;
  user?: AuthApiUser;
  message?: string;
  error?: AuthApiError;
};

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

function toAuthFailure(code: string, message: string): AuthApiResponse {
  return {
    success: false,
    message,
    error: {
      code,
      message,
    },
  };
}

function mapParsedAuthUser(userPayload: ParsedAuthUser): AuthApiUser {
  const joinedDate = userPayload.joinedDate;
  return {
    id: String(userPayload.id || ""),
    firstName: userPayload.firstName,
    lastName: userPayload.lastName,
    email: userPayload.email,
    phone: userPayload.phone,
    city: userPayload.city,
    area: userPayload.area,
    bio: userPayload.bio,
    avatar: userPayload.avatar,
    joinedDate,
    createdAt: joinedDate,
    updatedAt: new Date().toISOString(),
    roleID: userPayload.roleID,
    isDeleted: userPayload.isDeleted,
  };
}

function extractMessageFromErrorDetails(details: unknown): string {
  const detailsRecord = asRecord(details);
  if (!detailsRecord) {
    return "";
  }

  return readString(detailsRecord.Message ?? detailsRecord.message);
}

function isUniqueConstraintError(message: string): boolean {
  return (
    message.includes("UNIQUE KEY constraint") || message.includes("UQ_TbUsers")
  );
}

function mapSignupConstraintMessage(message: string): string {
  if (!isUniqueConstraintError(message)) {
    return message;
  }

  if (
    message.includes("UQ_TbUsers_E") ||
    message.includes("UQ_TbUsers_Email") ||
    message.includes("Email")
  ) {
    return "An account with this email address already exists. Please use a different email or try logging in.";
  }

  return "An account with this information already exists. Please check your details and try again.";
}

function resolveAuthFailureMessage<T>(
  response: ApiResponse<T>,
  fallbackMessage: string,
  normalizeSignupConstraint = false,
): string {
  if (response.success) {
    return fallbackMessage;
  }

  const messageFromDetails = extractMessageFromErrorDetails(
    response.error?.details,
  );
  const baseMessage =
    messageFromDetails ||
    readString(response.error?.message) ||
    fallbackMessage;

  if (response.error?.code === "CONNECTION_REFUSED") {
    return BACKEND_CONNECTION_SHORT_MESSAGE;
  }

  if (normalizeSignupConstraint) {
    return mapSignupConstraintMessage(baseMessage);
  }

  return baseMessage;
}

function handleAuthSuccessPayload(
  payload: unknown,
  failureCode: string,
  failureMessage: string,
  successFallbackMessage: string,
): AuthApiResponse {
  const parsedPayload = parseAuthEnvelope(payload);
  if (!parsedPayload) {
    debugError("Invalid auth response structure:", payload);
    return toAuthFailure("INVALID_RESPONSE", failureMessage);
  }

  if (parsedPayload.successFlag === false) {
    const errorMessage = parsedPayload.message || failureMessage;
    return toAuthFailure(failureCode, errorMessage);
  }

  const backendUser = parsedPayload.user
    ? mapParsedAuthUser(parsedPayload.user)
    : null;
  if (backendUser) {
    return {
      success: true,
      user: backendUser,
    };
  }

  return {
    success: true,
    message: parsedPayload.message || successFallbackMessage,
  };
}

// Authentication API
// ============================================================================
export const authApi = {
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

    debugLog("Login API response:", JSON.stringify(response, null, 2));
    debugLog("Response success:", response.success);
    if (response.success) {
      debugLog("Response data:", JSON.stringify(response.data, null, 2));
    } else {
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

    const response = await apiRequest<unknown>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        Email: userData.email?.trim() || null,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName || "",
        Phone: normalizedPhone,
        City: normalizedCity,
        Area: normalizedArea,
        Bio: normalizedBio || null,
        Avatar: normalizedAvatar || null,
      }),
    });

    debugLog("Signup API response:", response);
    debugLog("Response success:", response.success);
    if (response.success) {
      debugLog("Response data:", response.data);
    } else {
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

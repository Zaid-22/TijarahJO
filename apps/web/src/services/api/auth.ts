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
import { toIsoStringOrNow } from "./shared";

type AuthApiError = {
  code: string;
  message: string;
};

export type AuthApiUser = ApiUser & {
  roleID?: number;
  isDeleted?: boolean;
};

export type AuthApiResponse = {
  success: boolean;
  user?: AuthApiUser;
  message?: string;
  error?: AuthApiError;
};

type BackendUserPayload = {
  Id?: unknown;
  id?: unknown;
  FirstName?: unknown;
  firstName?: unknown;
  LastName?: unknown;
  lastName?: unknown;
  Email?: unknown;
  email?: unknown;
  Phone?: unknown;
  phone?: unknown;
  City?: unknown;
  city?: unknown;
  Area?: unknown;
  area?: unknown;
  Bio?: unknown;
  bio?: unknown;
  Avatar?: unknown;
  avatar?: unknown;
  JoinedDate?: unknown;
  joinedDate?: unknown;
  RoleID?: unknown;
  roleID?: unknown;
  IsDeleted?: unknown;
  isDeleted?: unknown;
};

type BackendAuthPayload = {
  Success?: unknown;
  success?: unknown;
  Message?: unknown;
  message?: unknown;
  User?: unknown;
  user?: unknown;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }
  return null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

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

function normalizeRoleId(value: unknown): number {
  const numericRoleId = Number(value);
  return Number.isInteger(numericRoleId) && numericRoleId > 0
    ? numericRoleId
    : 2;
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

function mapBackendUser(userPayload: BackendUserPayload): AuthApiUser {
  const joinedDate = toIsoStringOrNow(
    userPayload.JoinedDate ?? userPayload.joinedDate,
  );

  return {
    id: String(userPayload.Id ?? userPayload.id ?? ""),
    firstName: readString(userPayload.FirstName ?? userPayload.firstName),
    lastName: readString(userPayload.LastName ?? userPayload.lastName),
    email: readString(userPayload.Email ?? userPayload.email),
    phone: readString(userPayload.Phone ?? userPayload.phone),
    city: readString(userPayload.City ?? userPayload.city),
    area: readString(userPayload.Area ?? userPayload.area),
    bio: readString(userPayload.Bio ?? userPayload.bio),
    avatar: readString(userPayload.Avatar ?? userPayload.avatar) || undefined,
    joinedDate,
    createdAt: joinedDate,
    updatedAt: new Date().toISOString(),
    roleID: normalizeRoleId(userPayload.RoleID ?? userPayload.roleID),
    isDeleted: toBoolean(userPayload.IsDeleted ?? userPayload.isDeleted, false),
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

  const messageFromDetails = extractMessageFromErrorDetails(response.error?.details);
  const baseMessage =
    messageFromDetails || readString(response.error?.message) || fallbackMessage;

  if (response.error?.code === "CONNECTION_REFUSED") {
    return BACKEND_CONNECTION_SHORT_MESSAGE;
  }

  if (normalizeSignupConstraint) {
    return mapSignupConstraintMessage(baseMessage);
  }

  return baseMessage;
}

function resolveBackendAuthPayload(payload: unknown): BackendAuthPayload | null {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return null;
  }

  return payloadRecord as BackendAuthPayload;
}

function resolveBackendUser(payload: BackendAuthPayload): AuthApiUser | null {
  const userRecord = asRecord(payload.User ?? payload.user);
  if (!userRecord) {
    return null;
  }

  return mapBackendUser(userRecord as BackendUserPayload);
}

function handleAuthSuccessPayload(
  payload: unknown,
  failureCode: string,
  failureMessage: string,
  successFallbackMessage: string,
): AuthApiResponse {
  const backendPayload = resolveBackendAuthPayload(payload);
  if (!backendPayload) {
    debugError("Invalid auth response structure:", payload);
    return toAuthFailure("INVALID_RESPONSE", failureMessage);
  }

  const successFlag = backendPayload.Success ?? backendPayload.success;
  const backendMessage = readString(backendPayload.Message ?? backendPayload.message);

  if (successFlag === false) {
    const errorMessage = backendMessage || failureMessage;
    return toAuthFailure(failureCode, errorMessage);
  }

  const backendUser = resolveBackendUser(backendPayload);
  if (backendUser) {
    return {
      success: true,
      user: backendUser,
    };
  }

  if (successFlag !== false) {
    return {
      success: true,
      message: backendMessage || successFallbackMessage,
    };
  }

  return toAuthFailure("INVALID_RESPONSE", failureMessage);
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

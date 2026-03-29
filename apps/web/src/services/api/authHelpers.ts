import type { ApiResponse, User as ApiUser } from "../../types/api";
import { normalizeJordanPhone } from "../../utils/phone";
import {
  BACKEND_CONNECTION_SHORT_MESSAGE,
  debugError,
} from "./client";
import { asRecord, readString, toBoolean } from "./normalizers";
import { parseAuthEnvelope, type ParsedAuthUser } from "./schemas/authSchema";

export type AuthApiError = {
  code: string;
  message: string;
};

export type AuthApiUser = ApiUser & {
  roleID?: number;
  isDeleted?: boolean;
  RoleName?: string;
  roleName?: string;
  HasAdminAccess?: boolean;
  hasAdminAccess?: boolean;
  AdminPermissions?: string[];
  adminPermissions?: string[];
};

export type AuthApiResponse = {
  success: boolean;
  user?: AuthApiUser;
  message?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  error?: AuthApiError;
};

export type TwoFactorStatusApiResponse = {
  success: boolean;
  enabled: boolean;
  hasPendingSetup: boolean;
  message?: string;
};

export type TwoFactorSetupStartApiResponse = {
  success: boolean;
  secretKey?: string;
  otpAuthUri?: string;
  message?: string;
};

export function normalizeLoginIdentifier(value: string): string {
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

export function toAuthFailure(code: string, message: string): AuthApiResponse {
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
    RoleName: userPayload.RoleName,
    HasAdminAccess: userPayload.HasAdminAccess,
    AdminPermissions: userPayload.AdminPermissions,
  };
}

function extractMessageFromErrorDetails(details: unknown): string {
  const detailsRecord = asRecord(details);
  if (!detailsRecord) {
    return "";
  }

  return readString(
    detailsRecord.Message ??
      detailsRecord.message ??
      detailsRecord.Detail ??
      detailsRecord.detail,
  );
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

export function resolveMessageFromPayload(payload: unknown, fallback: string): string {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return fallback;
  }

  return readString(payloadRecord.message ?? payloadRecord.Message) || fallback;
}

export function parseTwoFactorStatusPayload(
  payload: unknown,
): TwoFactorStatusApiResponse {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return {
      success: false,
      enabled: false,
      hasPendingSetup: false,
      message: "Invalid two-factor status response.",
    };
  }

  return {
    success: true,
    enabled: Boolean(payloadRecord.Enabled ?? payloadRecord.enabled),
    hasPendingSetup: Boolean(
      payloadRecord.HasPendingSetup ?? payloadRecord.hasPendingSetup,
    ),
  };
}

export function parseTwoFactorSetupStartPayload(
  payload: unknown,
): TwoFactorSetupStartApiResponse {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) {
    return {
      success: false,
      message: "Invalid two-factor setup response.",
    };
  }

  const secretKey = readString(
    payloadRecord.SecretKey ?? payloadRecord.secretKey,
  );
  const otpAuthUri = readString(
    payloadRecord.OtpAuthUri ?? payloadRecord.otpAuthUri,
  );
  const message = readString(payloadRecord.Message ?? payloadRecord.message);
  const success = toBoolean(
    payloadRecord.Success ?? payloadRecord.success,
    true,
  );

  if (!success) {
    return {
      success: false,
      message: message || "Two-factor setup could not be started.",
    };
  }

  return {
    success: true,
    secretKey: secretKey || undefined,
    otpAuthUri: otpAuthUri || undefined,
    message,
  };
}

export function resolveAuthFailureMessage<T>(
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

export function handleAuthSuccessPayload(
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

  if (parsedPayload.requiresTwoFactor) {
    return {
      success: true,
      requiresTwoFactor: true,
      twoFactorToken: parsedPayload.twoFactorToken,
      message:
        parsedPayload.message ||
        "Two-factor verification is required to complete sign in.",
    };
  }

  return {
    success: true,
    message: parsedPayload.message || successFallbackMessage,
  };
}

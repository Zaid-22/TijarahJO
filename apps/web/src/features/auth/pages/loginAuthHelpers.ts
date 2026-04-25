/**
 * Pure helper functions used by the Login page.
 *
 * Extracted from LoginPage.tsx to reduce component file size and
 * improve testability — these functions have no React dependencies.
 */
import { readStringArray } from "../../../services/api/normalizers";
import { resolveHasAdminAccessFromPayload } from "../../../contexts/authUtils";

/**
 * Extract an error code (e.g. CONNECTION_REFUSED, LOGIN_FAILED)
 * from an API response payload.
 */
export const extractApiCode = (payload: unknown): string => {
  if (typeof payload !== "object" || payload === null) return "";
  const record = payload as Record<string, unknown>;
  const code = record.code ?? record.Code ?? record.errorCode ?? record.ErrorCode;
  return typeof code === "string" ? code : "";
};

/**
 * Extract a human-readable message from an API response payload.
 */
export const extractApiMessage = (payload: unknown): string => {
  if (typeof payload !== "object" || payload === null) return "";
  const record = payload as Record<string, unknown>;
  const message = record.message ?? record.Message ?? record.error ?? record.Error;
  return typeof message === "string" ? message.trim() : "";
};

export const extractErrorMessage = (
  payload: unknown,
  fallback: string,
  backendConnectionMessage: string,
): string => {
  const code = extractApiCode(payload);
  if (code === "CONNECTION_REFUSED") {
    return backendConnectionMessage;
  }

  if (code === "LOGIN_FAILED") {
    return fallback;
  }

  const message = extractApiMessage(payload);
  const normalizedMessage = (message || "").toLowerCase();
  if (
    normalizedMessage.includes("invalid email/phone or password") ||
    normalizedMessage.includes("invalid email or password")
  ) {
    return fallback;
  }

  return message || fallback;
};

export const toExceptionMessage = (
  error: unknown,
  fallbackMessage: string,
  backendConnectionMessage: string,
): string => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("ERR_CONNECTION_REFUSED")
  ) {
    return backendConnectionMessage;
  }

  return error.message;
};

export const appendDuplicateAccountHint = (
  message: string,
  duplicateHintSuffix: string,
): string => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("try logging in") ||
    normalizedMessage.includes("switch to sign in") ||
    normalizedMessage.includes("sign in if you already have an account")
  ) {
    return message;
  }

  if (
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("email address already")
  ) {
    return `${message} ${duplicateHintSuffix}`;
  }

  return message;
};

export const normalizeTwoFactorCode = (value: string): string => {
  return value.replace(/\D+/g, "");
};

export const resolveLoginRole = (user: unknown): "admin" | "user" => {
  const payload =
    typeof user === "object" && user !== null
      ? (user as Record<string, unknown>)
      : null;

  return resolveHasAdminAccessFromPayload(payload) ? "admin" : "user";
};

export const readAuthString = (
  payload: Record<string, unknown> | null,
  ...keys: string[]
): string => {
  if (!payload) {
    return "";
  }

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
};

export const readAuthPermissions = (payload: unknown): string[] => {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  return readStringArray(
    (payload as Record<string, unknown>).AdminPermissions ??
      (payload as Record<string, unknown>).adminPermissions ??
      (payload as Record<string, unknown>).Permissions ??
      (payload as Record<string, unknown>).permissions,
  );
};

export const readAuthPositiveInt = (
  payload: Record<string, unknown> | null,
  ...keys: string[]
): number | undefined => {
  if (!payload) {
    return undefined;
  }

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return undefined;
};

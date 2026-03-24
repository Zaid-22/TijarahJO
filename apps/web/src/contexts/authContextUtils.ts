import { User } from "../types";
import { logger } from "../shared/lib/logger";

const DEBUG_AUTH =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_AUTH === "true";

export const debugAuthLog = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    logger.info(...args);
  }
};

export const debugAuthWarn = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    logger.warn(...args);
  }
};

export const debugAuthError = (...args: unknown[]) => {
  if (DEBUG_AUTH) {
    logger.error(...args);
  }
};

export const AUTH_GUEST_KEY = "guestMode";
export const AUTH_LOGOUT_KEY = "tijarahjo_logged_out";
export const AUTH_LEGACY_KEYS = [
  "tijarahjo_token",
  "tijarahjo_auth",
  "tijarahjo_user",
];

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";
export const BACKEND_UNAVAILABLE_MESSAGE =
  "Cannot verify your session right now. Please check your connection and try again.";

const AUTH_NETWORK_ERROR_CODES = new Set([
  "CONNECTION_REFUSED",
  "TIMEOUT",
  "NETWORK_ERROR",
]);

export const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const getErrorMessage = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);

export const normalizeMessage = (
  message: string | undefined,
  fallback: string,
): string => {
  const trimmed = message?.trim();
  return trimmed ? trimmed : fallback;
};

export const isRetryableAuthError = (
  error: { code?: string; message?: string } | undefined,
) => {
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

export type AuthFallbackUser = {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: User["role"];
  id?: string;
  avatar?: string;
};

export type CurrentUserResult =
  | { status: "success"; user: User }
  | { status: "auth_error"; message: string }
  | { status: "network_error"; message: string };

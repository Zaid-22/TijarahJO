import { APP_CONFIG } from "../../constants/appConfig";
import { ApiResponse } from "../../types/api";
import { logger } from "../../shared/lib/logger";

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = APP_CONFIG.apiBaseUrl;
const REQUEST_TIMEOUT_MS = APP_CONFIG.requestTimeoutMs;
const DEBUG_API =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_API === "true";

const BACKEND_URL_HINT = APP_CONFIG.backendHostUrl;
const BACKEND_RUN_COMMAND = APP_CONFIG.backendRunCommand;
const BACKEND_TIMEOUT_MESSAGE = `Request timed out. Please check if the backend is running on ${BACKEND_URL_HINT}`;
const BACKEND_CONNECTION_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${BACKEND_URL_HINT}. Start it with: ${BACKEND_RUN_COMMAND}`;
export const BACKEND_CONNECTION_SHORT_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${BACKEND_URL_HINT}`;

export type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  throwOnAbort?: boolean;
};

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const needle = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(needle)) {
      const rawValue = part.slice(needle.length);
      return decodeURIComponent(rawValue);
    }
  }

  return null;
}

function isUnsafeMethod(method: string): boolean {
  const normalized = method.toUpperCase();
  return !(
    normalized === "GET" ||
    normalized === "HEAD" ||
    normalized === "OPTIONS" ||
    normalized === "TRACE"
  );
}

function hasAuthorizationHeader(headers?: HeadersInit): boolean {
  if (!headers) {
    return false;
  }

  if (headers instanceof Headers) {
    return headers.has("Authorization");
  }

  if (Array.isArray(headers)) {
    return headers.some(
      ([key, value]) =>
        key.toLowerCase() === "authorization" &&
        String(value).trim().length > 0,
    );
  }

  return Object.entries(headers).some(
    ([key, value]) =>
      key.toLowerCase() === "authorization" &&
      String(value ?? "").trim().length > 0,
  );
}

async function resolveCsrfToken(
  method: string,
  headers?: HeadersInit,
): Promise<string | null> {
  if (!isUnsafeMethod(method) || hasAuthorizationHeader(headers)) {
    return null;
  }

  const existingToken = getCookieValue("XSRF-TOKEN");
  if (existingToken) {
    return existingToken;
  }

  // Prime XSRF-TOKEN for cookie-authenticated write requests.
  try {
    await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    // Ignore priming errors and allow request flow to surface the real failure.
  }

  return getCookieValue("XSRF-TOKEN");
}

export const debugLog = (...args: unknown[]) => {
  if (DEBUG_API) {
    logger.info(...args);
  }
};

// ---- Token refresh logic ----
// Prevents concurrent refresh attempts (only one in-flight at a time).
let refreshPromise: Promise<boolean> | null = null;

const AUTH_ENDPOINTS_NO_RETRY = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password/request",
  "/auth/forgot-password/confirm",
  "/auth/2fa/verify-login",
];

function shouldAttemptRefresh(endpoint: string): boolean {
  return !AUTH_ENDPOINTS_NO_RETRY.some((path) => endpoint.startsWith(path));
}

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const debugWarn = (...args: unknown[]) => {
  if (DEBUG_API) {
    logger.warn(...args);
  }
};

export const debugError = (...args: unknown[]) => {
  if (DEBUG_API) {
    logger.error(...args);
  }
};

function createAbortError(message = "Request cancelled"): Error {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

// Shared HTTP helper used across all API domains.
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    timeoutMs = REQUEST_TIMEOUT_MS,
    throwOnAbort = false,
    signal: callerSignal,
    ...requestOptions
  } = options;

  const controller = new AbortController();
  let didTimeout = false;
  const syncAbortFromCaller = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };
  if (callerSignal) {
    if (callerSignal.aborted) {
      syncAbortFromCaller();
    } else {
      callerSignal.addEventListener("abort", syncAbortFromCaller, {
        once: true,
      });
    }
  }
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const method = (requestOptions.method || "GET").toUpperCase();
    const csrfToken = await resolveCsrfToken(method, requestOptions.headers);
    const requestHeaders = new Headers(requestOptions.headers);
    const isFormDataBody =
      typeof FormData !== "undefined" &&
      requestOptions.body instanceof FormData;
    if (!isFormDataBody && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }
    if (csrfToken) {
      requestHeaders.set("X-CSRF-Token", csrfToken);
    }

    if (callerSignal?.aborted) {
      if (throwOnAbort) {
        throw createAbortError();
      }

      return {
        success: false,
        error: {
          code: "ABORTED",
          message: "Request cancelled",
        },
      };
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? "include",
      signal: controller.signal,
      headers: requestHeaders,
    });

    // Auto-retry on 401 by refreshing the JWT cookie (one attempt only).
    if (response.status === 401 && shouldAttemptRefresh(endpoint)) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Re-resolve CSRF token since the cookie changed.
        const freshCsrfToken = await resolveCsrfToken(
          method,
          requestOptions.headers,
        );
        const retryHeaders = new Headers(requestHeaders);
        if (freshCsrfToken) {
          retryHeaders.set("X-CSRF-Token", freshCsrfToken);
        }
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...requestOptions,
          credentials: requestOptions.credentials ?? "include",
          signal: controller.signal,
          headers: retryHeaders,
        });
      }
    }

    // Check if response has content
    const text = await response.text();

    // If response is empty, return appropriate response
    if (!text || text.trim().length === 0) {
      if (response.ok) {
        return { success: true, data: null as T };
      } else {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || "An error occurred",
            details: null,
          },
        };
      }
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // If not JSON, check if it's a plain text error message
      // Backend sometimes returns plain text errors (especially 500 errors)
      if (!response.ok && text) {
        // Return the plain text as the error message
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: text.trim(),
            details: { rawResponse: text },
          },
        };
      }

      // If response is OK but not JSON, that's unexpected
      if (response.ok) {
        // Try to return as success with text data
        return {
          success: true,
          data: text as T,
        };
      }

      // If not JSON and not OK, return error
      return {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: text
            ? text.substring(0, 100)
            : "Invalid JSON response from server",
          details: { rawResponse: text },
        },
      };
    }

    if (!response.ok) {
      // For BadRequest (400), the error details are in the response body
      // ASP.NET Core returns AuthResponse with Message property
      const errorMessage =
        data.message ||
        data.Message ||
        data.error?.message ||
        data.error?.Message ||
        response.statusText ||
        "An error occurred";

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
          details: data,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        if (callerSignal?.aborted && !didTimeout && throwOnAbort) {
          throw createAbortError();
        }

        if (callerSignal?.aborted && !didTimeout) {
          return {
            success: false,
            error: {
              code: "ABORTED",
              message: "Request cancelled",
            },
          };
        }

        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: BACKEND_TIMEOUT_MESSAGE,
          },
        };
      }
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("ERR_CONNECTION_REFUSED") ||
        error.message.includes("NetworkError")
      ) {
        return {
          success: false,
          error: {
            code: "CONNECTION_REFUSED",
            message: BACKEND_CONNECTION_MESSAGE,
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please check if the backend is running.",
      },
    };
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal) {
      callerSignal.removeEventListener("abort", syncAbortFromCaller);
    }
  }
}

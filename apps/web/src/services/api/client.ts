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

export const debugLog = (...args: unknown[]) => {
  if (DEBUG_API) {
    logger.info(...args);
  }
};

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

// Shared HTTP helper used across all API domains.
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const method = (options.method || "GET").toUpperCase();
    const csrfToken = isUnsafeMethod(method) ? getCookieValue("XSRF-TOKEN") : null;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      credentials: options.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

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
  }
}

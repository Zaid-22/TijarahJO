/**
 * API Service Layer for TijarahJo
 *
 * This service provides a clean interface for all backend API calls.
 * Replace the mock data with actual API endpoints when backend is ready.
 */

import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  CreatePostRequest,
  UpdatePostRequest,
  UpdatePostStatusRequest,
  PostResponse,
  PostsListResponse,
  SellerProfileResponse,
  ApiResponse,
  SearchRequest,
  CategoriesResponse,
} from "../types/api";
import { Message, Product } from "../types";
import { APP_CONFIG } from "../constants/appConfig";
import { normalizeJordanPhone } from "../utils/phone";

// ============================================================================
// Configuration
// ============================================================================

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = APP_CONFIG.apiBaseUrl;
const REQUEST_TIMEOUT_MS = APP_CONFIG.requestTimeoutMs;
const DEBUG_API =
  Boolean((import.meta as any).env?.DEV) &&
  (import.meta as any).env?.VITE_DEBUG_API === "true";

const BACKEND_URL_HINT = APP_CONFIG.backendHostUrl;
const BACKEND_RUN_COMMAND = APP_CONFIG.backendRunCommand;
const BACKEND_TIMEOUT_MESSAGE = `Request timed out. Please check if the backend is running on ${BACKEND_URL_HINT}`;
const BACKEND_CONNECTION_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${BACKEND_URL_HINT}. Start it with: ${BACKEND_RUN_COMMAND}`;
const BACKEND_CONNECTION_SHORT_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${BACKEND_URL_HINT}`;

const debugLog = (...args: any[]) => {
  if (DEBUG_API) {
    console.log(...args);
  }
};

const debugWarn = (...args: any[]) => {
  if (DEBUG_API) {
    console.warn(...args);
  }
};

const debugError = (...args: any[]) => {
  if (DEBUG_API) {
    console.error(...args);
  }
};

function normalizeProductStatus(rawStatus: unknown): "ACTIVE" | "SOLD" | "DELETED" {
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toUpperCase();
    if (normalized === "SOLD") {
      return "SOLD";
    }
    if (
      normalized === "DELETED" ||
      normalized === "BLOCKED" ||
      normalized === "INACTIVE"
    ) {
      return "DELETED";
    }
    return "ACTIVE";
  }

  const numericStatus = Number(rawStatus);
  if (numericStatus === 3) {
    return "SOLD";
  }
  if (numericStatus === 1 || numericStatus === 2) {
    return "DELETED";
  }
  return "ACTIVE";
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

// Mock mode disabled - using real backend API only
// const MOCK_MODE = false; // Removed mock mode completely

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem("tijarahjo_token");

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Check if response has content
    const text = await response.text();

    // If response is empty, return appropriate response
    if (!text || text.trim().length === 0) {
      if (response.ok) {
        return { success: true, data: null as any };
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
          data: text as any,
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

// ============================================================================
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
  ): Promise<any> => {
    // Split name into first and last name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

    const userData: any = {
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
// Helper Functions: Transform Backend Models to Frontend Types
// ============================================================================

/**
 * Helper function to fetch and cache categories and users for enriching posts
 */
let categoriesCache: Record<string, string> | null = null;
let usersCache: Record<string, string> | null = null;
let postImagesCache: any[] | null = null;
let categoriesCacheUpdatedAt = 0;
let usersCacheUpdatedAt = 0;
let postImagesCacheUpdatedAt = 0;
let usersAllEndpointAccessible: boolean | null = null;
const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
}

function invalidatePostImagesCache() {
  postImagesCache = null;
  postImagesCacheUpdatedAt = 0;
}

function groupImagesByPostId(images: any[]): Record<string, string[]> {
  const imagesByPostId: Record<string, string[]> = {};

  images.forEach((img: any) => {
    const postId = img?.PostID?.toString() || "";
    const imageUrl = img?.PostImageURL;
    if (!postId || !imageUrl || typeof imageUrl !== "string") {
      return;
    }
    if (img?.IsDeleted) {
      return;
    }

    const normalizedUrl = imageUrl.trim();
    if (!normalizedUrl) {
      return;
    }

    if (!imagesByPostId[postId]) {
      imagesByPostId[postId] = [];
    }
    imagesByPostId[postId].push(normalizedUrl);
  });

  return imagesByPostId;
}

async function getAllPostImages(forceRefresh: boolean = false): Promise<any[]> {
  if (!forceRefresh && postImagesCache && isCacheFresh(postImagesCacheUpdatedAt)) {
    return postImagesCache;
  }

  const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
    method: "GET",
  });

  if (imagesResponse.success && Array.isArray(imagesResponse.data)) {
    postImagesCache = imagesResponse.data;
    postImagesCacheUpdatedAt = Date.now();
    return postImagesCache;
  }

  return postImagesCache || [];
}

async function ensureCategoriesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, string>> {
  if (!forceRefresh && categoriesCache && isCacheFresh(categoriesCacheUpdatedAt)) {
    return categoriesCache;
  }

  const categoriesResponse = await apiRequest<any[]>("/categories/All", {
    method: "GET",
  });

  if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
    const nextCache: Record<string, string> = {};
    categoriesResponse.data.forEach((cat: any) => {
      const catId = cat?.CategoryID ?? cat?.categoryID ?? cat?.id;
      const catName = cat?.CategoryName || cat?.categoryName || cat?.name;
      if (catId !== null && catId !== undefined && catName) {
        nextCache[String(catId)] = String(catName);
      }
    });

    categoriesCache = nextCache;
    categoriesCacheUpdatedAt = Date.now();
    return categoriesCache;
  }

  if (!categoriesCache) {
    categoriesCache = {};
  }
  return categoriesCache;
}

function getUserIdentifier(user: any): string {
  const userId = user?.UserID ?? user?.userID ?? user?.Id ?? user?.id;
  return userId === null || userId === undefined ? "" : String(userId);
}

function getUserDisplayName(user: any, fallbackUserId?: string): string {
  const explicitName = user?.Name || user?.name;
  if (typeof explicitName === "string" && explicitName.trim()) {
    return explicitName.trim();
  }

  const firstName = user?.FirstName || user?.firstName || "";
  const lastName = user?.LastName || user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email = user?.Email || user?.email || "";
  if (email) {
    return email;
  }

  return fallbackUserId ? `User ${fallbackUserId}` : "Unknown";
}

function isAdminRoleClaimValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => isAdminRoleClaimValue(entry));
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "admin";
  }

  return false;
}

function isCurrentSessionAdmin(): boolean {
  const token = localStorage.getItem("tijarahjo_token");
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const roleClaim =
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    payload.role ??
    payload.roles ??
    payload.RoleID ??
    payload.roleID;

  return isAdminRoleClaimValue(roleClaim);
}

async function ensureUsersCache(
  forceRefresh: boolean = false,
  userIds: Array<string | number> = [],
): Promise<Record<string, string>> {
  if (!usersCache) {
    usersCache = {};
  }

  const requestedUserIds = Array.from(
    new Set(
      userIds
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0 && id !== "0"),
    ),
  );

  const shouldRefreshAllUsersCache =
    forceRefresh || !isCacheFresh(usersCacheUpdatedAt) || Object.keys(usersCache).length === 0;

  if (
    shouldRefreshAllUsersCache &&
    usersAllEndpointAccessible !== false &&
    isCurrentSessionAdmin()
  ) {
    const usersResponse = await apiRequest<any[]>("/users/All", {
      method: "GET",
    });

    if (usersResponse.success && Array.isArray(usersResponse.data)) {
      const nextCache: Record<string, string> = {};
      usersResponse.data.forEach((user: any) => {
        const userId = getUserIdentifier(user);
        if (!userId) {
          return;
        }

        nextCache[userId] = getUserDisplayName(user, userId);
      });

      usersCache = nextCache;
      usersCacheUpdatedAt = Date.now();
      usersAllEndpointAccessible = true;
    } else if (!usersResponse.success) {
      const errorCode = usersResponse.error?.code || "";
      if (errorCode === "HTTP_401" || errorCode === "HTTP_403") {
        usersAllEndpointAccessible = false;
      }
    }
  }

  const missingUserIds = requestedUserIds.filter((id) => !usersCache?.[id]);

  if (missingUserIds.length > 0) {
    await Promise.all(
      missingUserIds.map(async (userId) => {
        const userResponse = await apiRequest<any>(`/users/${userId}`, {
          method: "GET",
        });

        if (userResponse.success && userResponse.data) {
          const resolvedUserId = getUserIdentifier(userResponse.data) || userId;
          const displayName = getUserDisplayName(
            userResponse.data,
            resolvedUserId,
          );

          usersCache![resolvedUserId] = displayName;
          usersCache![userId] = displayName;
          return;
        }

        usersCache![userId] = `User ${userId}`;
      }),
    );
    usersCacheUpdatedAt = Date.now();
  }

  return usersCache;
}

/**
 * Clear caches - call this when data might have changed (e.g., after creating a post)
 */
export function clearCaches() {
  categoriesCache = null;
  usersCache = null;
  postImagesCache = null;
  categoriesCacheUpdatedAt = 0;
  usersCacheUpdatedAt = 0;
  postImagesCacheUpdatedAt = 0;
  usersAllEndpointAccessible = null;
}

function toNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    return null;
  }

  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toIsoStringOrNow(value: unknown): string {
  if (value !== null && value !== undefined && value !== "") {
    const parsedDate = new Date(value as string | number | Date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date().toISOString();
}

function normalizeMessage(message: any): Message {
  const rawTimestamp = message?.Timestamp ?? message?.timestamp;
  const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : null;

  return {
    messageId: toNumber(message?.MessageId ?? message?.messageId, 0) || undefined,
    senderId: toNumber(message?.SenderId ?? message?.senderId),
    receiverId: toNumber(message?.ReceiverId ?? message?.receiverId),
    postId:
      message?.PostId !== null && message?.PostId !== undefined
        ? toNumber(message?.PostId, 0) || undefined
        : message?.postId !== null && message?.postId !== undefined
          ? toNumber(message?.postId, 0) || undefined
          : undefined,
    content: String(message?.Content ?? message?.content ?? ""),
    timestamp:
      parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
        ? parsedTimestamp.toISOString()
        : new Date().toISOString(),
    isRead: Boolean(message?.IsRead ?? message?.isRead ?? false),
  };
}

async function enrichPostsWithCategoryAndSeller(
  posts: any[],
  forceRefresh: boolean = false,
): Promise<any[]> {
  const postUserIds = posts
    .map((post: any) =>
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId,
    )
    .filter(
      (id: any) =>
        id !== null &&
        id !== undefined &&
        String(id).trim() !== "" &&
        String(id) !== "0",
    );

  const [resolvedCategories, resolvedUsers] = await Promise.all([
    ensureCategoriesCache(forceRefresh),
    ensureUsersCache(forceRefresh, postUserIds),
  ]);

  return posts.map((post: any) => {
    const categoryId = post?.CategoryID ?? post?.categoryID;
    const userId =
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId;

    let categoryName = String(post?.Category || post?.category || "").trim();
    if (!categoryName) {
      categoryName =
        categoryId !== null && categoryId !== undefined
          ? resolvedCategories[String(categoryId)] || "Unknown"
          : "Unknown";
    }

    const existingSeller =
      typeof (post?.Seller ?? post?.seller) === "string"
        ? String(post?.Seller ?? post?.seller).trim()
        : "";
    let sellerName = existingSeller;
    if (!sellerName) {
      sellerName =
        userId !== null && userId !== undefined
          ? resolvedUsers[String(userId)] || `User ${userId}`
          : "Unknown";
    }

    return {
      ...post,
      Category: categoryName,
      Seller: sellerName,
    };
  });
}

/**
 * Transform backend PostModel to frontend Product type
 */
function transformPostModelToProduct(
  postModel: any,
  images: string[] = [],
  fallbackIndex?: number,
): Product {
  const normalizePostImages = (rawImages: unknown[]): string[] => {
    const sanitized = rawImages
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

    if (sanitized.length === 0) {
      return [];
    }

    const normalized: string[] = [];
    for (let i = 0; i < sanitized.length; i += 1) {
      const current = sanitized[i];

      // Backend list endpoints may split data URLs at the first comma.
      // Rebuild `data:*;base64,<payload>` when needed.
      const looksLikeSplitDataPrefix =
        current.startsWith("data:") &&
        current.includes(";base64") &&
        !current.includes(",") &&
        i + 1 < sanitized.length;

      if (looksLikeSplitDataPrefix) {
        const payload = sanitized[i + 1];
        if (
          payload &&
          !payload.startsWith("http://") &&
          !payload.startsWith("https://") &&
          !payload.startsWith("data:") &&
          !payload.startsWith("blob:")
        ) {
          normalized.push(`${current},${payload}`);
          i += 1;
          continue;
        }
      }

      normalized.push(current);
    }

    return normalized;
  };

  // Get images for this post
  // Handle various casing valid from backend or frontend
  const backendImages = postModel.Images || postModel.images || [];
  const singleImage = postModel.PostImageURL || postModel.postImageURL || "";
  const preferredImages = images.length > 0 ? images : backendImages;
  const normalizedImages = normalizePostImages(
    preferredImages.length > 0 ? preferredImages : [singleImage],
  );
  const postImages = normalizedImages.length > 0 ? normalizedImages : [singleImage].filter(Boolean);

  // Ensure we always have a unique ID - use fallback index if needed
  const postId = postModel.PostID?.toString() || postModel.id;
  const uniqueId =
    postId ||
    (fallbackIndex !== undefined
      ? `post-${fallbackIndex}`
      : `post-${Date.now()}-${Math.random()}`);

  const name = postModel.PostTitle ?? postModel.name ?? "";
  const description = postModel.PostDescription ?? postModel.description ?? "";

  return {
    id: uniqueId,
    name: name,
    price: postModel.Price ?? postModel.price ?? 0,
    location: postModel.City ?? postModel.Location ?? postModel.location ?? "Jordan",
    area: postModel.Area ?? postModel.area,
    seller: postModel.Seller ?? postModel.seller ?? "Unknown",
    sellerId:
      postModel.UserID?.toString() ??
      postModel.UserId?.toString() ??
      postModel.SellerID?.toString() ??
      postModel.sellerId ??
      "",
    category: postModel.Category ?? postModel.category ?? "Unknown",
    categoryId:
      postModel.CategoryID?.toString() ??
      postModel.CategoryId?.toString() ??
      postModel.categoryId ??
      "",
    image: postImages[0] ?? "",
    images: postImages,
    description: description,
    createdAt: toIsoStringOrNow(postModel.CreatedAt ?? postModel.createdAt),
    views: postModel.Views ?? postModel.views ?? 0,
    status: normalizeProductStatus(postModel.Status ?? postModel.status),
  };
}

/**
 * Transform backend CategoryModel to frontend Category type (from api.ts)
 */
function transformCategoryModelToCategory(
  categoryModel: any,
  fallbackIndex?: number,
): import("../types/api").Category {
  const categoryId =
    categoryModel.CategoryID?.toString() ||
    categoryModel.categoryID?.toString() ||
    categoryModel.id;
  const uniqueId =
    categoryId ||
    (fallbackIndex !== undefined
      ? `category-${fallbackIndex}`
      : `category-${Date.now()}-${Math.random()}`);

  const name = categoryModel.CategoryName || categoryModel.categoryName || categoryModel.name || "";
  const nameAr =
    categoryModel.NameAr ||
    categoryModel.nameAr ||
    categoryModel.categoryNameAr ||
    name;

  return {
    id: uniqueId,
    name,
    nameAr,
    icon: categoryModel.Icon || categoryModel.icon || "box",
    color: categoryModel.Color || categoryModel.color || "#0A4ABF",
    image: categoryModel.Image || categoryModel.image || "",
    postCount: 0, // Will be calculated separately if needed
  };
}

// ============================================================================
// Posts/Products API
// ============================================================================

export const postsApi = {
  /**
   * Get all posts with optional filters and pagination
   */
  getPosts: async (params?: SearchRequest): Promise<PostsListResponse> => {
    // Use pagination endpoint if page/limit provided, otherwise use All
    if (params?.page || params?.limit) {
      const pageNumber = params.page || 1;
      const rowsPerPage = params.limit || 20;

      const response = await apiRequest<any[]>(
        `/posts/pagination?PageNumber=${pageNumber}&RowsPerPage=${rowsPerPage}&IncludeDeleted=false`,
        { method: "GET" },
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        const allImages = await getAllPostImages();
        const imagesByPostId = groupImagesByPostId(allImages);

        // Enrich posts with category and seller names
        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data,
        );

        // Process posts (even if empty array)
        const posts = enrichedPosts.map((post: any) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || [],
          ),
        );

        return {
          success: true,
          posts,
          pagination: {
            currentPage: pageNumber,
            totalPages:
              response.data.length > 0
                ? Math.ceil(posts.length / rowsPerPage)
                : 0,
            totalPosts: posts.length,
            postsPerPage: rowsPerPage,
          },
        };
      }
    } else {
      // Get all posts
      const response = await apiRequest<any[]>("/posts/All", {
        method: "GET",
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // Enrich posts with category and seller names
        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data,
        );

        // Always merge images from TbPostImages for consistency across DB/SP variants.
        const allImages = await getAllPostImages();
        const imagesByPostId = groupImagesByPostId(allImages);
        const posts = enrichedPosts.map((post: any, index: number) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || [],
            index,
          ),
        );

        return {
          success: true,
          posts,
          pagination: {
            currentPage: 1,
            totalPages: response.data.length > 0 ? 1 : 0,
            totalPosts: posts.length,
            postsPerPage: posts.length > 0 ? posts.length : 20,
          },
        };
      }
    }

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: 20,
      },
    };
  },

  /**
   * Get single post by ID
   */
  getPost: async (id: string): Promise<Product | null> => {
    const response = await apiRequest<any>(`/posts/${id}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      // Get images for this post
      const allImages = await getAllPostImages();

      const postImages = allImages
        .filter((img: any) => img.PostID?.toString() === id && !img.IsDeleted)
        .map((img: any) => img.PostImageURL)
        .filter((url: string) => url && url.trim() !== "");

      // Enrich post with category and seller names before transforming
      const enrichedPost = await enrichPostsWithCategoryAndSeller([
        response.data,
      ]);
      const enrichedPostData = enrichedPost[0] || response.data;

      const transformed = transformPostModelToProduct(
        enrichedPostData,
        postImages,
      );

      return transformed;
    }

    return null;
  },

  /**
   * Create new post
   */
  createPost: async (postData: CreatePostRequest): Promise<PostResponse> => {
    // Get current user ID from JWT token by calling /auth/me endpoint
    let userId = "";
    try {
      const currentUserResponse = await api.auth.getCurrentUser();
      if (currentUserResponse.success && currentUserResponse.data) {
        const user = currentUserResponse.data as any;
        userId = (user.Id || user.id || "").toString();
        debugLog("[createPost] Got user ID from /auth/me:", userId);
      } else {
        debugWarn("[createPost] Failed to get current user from /auth/me");
      }
    } catch (error) {
      debugError("[createPost] Error getting current user:", error);
    }

    // Try to decode JWT token as fallback
    if (!userId) {
      try {
        const token = localStorage.getItem("tijarahjo_token");
        if (token) {
          const payload = decodeJwtPayload(token);
          userId = String(payload?.nameid ?? payload?.sub ?? "");
          debugLog("[createPost] Got user ID from JWT token:", userId);
        }
      } catch (tokenError) {
        debugError("[createPost] Error decoding token:", tokenError);
      }
    }

    // If still no user ID, throw error instead of defaulting to admin
    if (!userId || userId === "" || userId === "0") {
      const errorMsg =
        "Cannot create post: User not authenticated. Please log in first.";
      debugError("[createPost]", errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: {
          code: "UNAUTHORIZED",
          message: errorMsg,
        },
      } as any;
    }

    // Find category ID by name
    const categoriesResponse = await apiRequest<any[]>("/categories/All", {
      method: "GET",
    });
    const categories = categoriesResponse.success
      ? categoriesResponse.data || []
      : [];
    const normalizedCategory = (postData.category || "").trim();
    const category = categories.find(
      (cat: any) =>
        cat.CategoryName?.toLowerCase() ===
        normalizedCategory.toLowerCase(),
    );

    let categoryId =
      category?.CategoryID !== undefined && category?.CategoryID !== null
        ? Number(category.CategoryID)
        : Number.NaN;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      const parsedCategoryId = Number.parseInt(normalizedCategory, 10);
      if (Number.isInteger(parsedCategoryId) && parsedCategoryId > 0) {
        categoryId = parsedCategoryId;
      }
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      const errorMsg =
        "Cannot create post: selected category is invalid or not available.";
      return {
        success: false,
        message: errorMsg,
        error: {
          code: "INVALID_CATEGORY",
          message: errorMsg,
        },
      } as any;
    }

    // Map frontend format to backend PostModel format
    const backendPost = {
      PostID: null,
      UserID: parseInt(userId),
      CategoryID: categoryId,
      PostTitle: postData.title,
      PostDescription: postData.description || "",
      Price: postData.price,
      Status: 0, // 0 = ACTIVE
      CreatedAt: new Date().toISOString(),
      IsDeleted: false,
      City: postData.location || postData.city || "Jordan",
      Area: postData.area || null,
    };

    const response = await apiRequest<any>("/posts", {
      method: "POST",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      const postId = response.data.PostID || response.data.postID;
      debugLog("[createPost] Post created with ID:", postId);

      // Create post images
      const savedImageUrls: string[] = [];
      if (postData.images && postData.images.length > 0) {
        debugLog(
          "[createPost] Creating",
          postData.images.length,
          "images for post",
          postId,
        );
        const imagePromises = postData.images.map(async (imageUrl, index) => {
          if (!imageUrl || imageUrl.trim() === "") {
            debugWarn(
              `[createPost] Skipping empty image URL at index ${index}`,
            );
            return null;
          }

          try {
            const imageResponse = await apiRequest<any>("/TbPostImages", {
              method: "POST",
              body: JSON.stringify({
                PostID: postId,
                PostImageURL: imageUrl,
                UploadedAt: new Date().toISOString(),
                IsDeleted: false,
              }),
            });

            if (imageResponse.success && imageResponse.data) {
              debugLog(
                `[createPost] Image ${index + 1} created successfully:`,
                imageResponse.data,
              );
              savedImageUrls.push(imageUrl);
              return imageResponse.data;
            } else {
              const errorMsg =
                !imageResponse.success && "error" in imageResponse
                  ? imageResponse.error?.message || "Unknown error"
                  : "Unknown error";
              debugError(
                `[createPost] Failed to create image ${index + 1}:`,
                errorMsg,
              );
              return null;
            }
          } catch (error) {
            debugError(
              `[createPost] Error creating image ${index + 1}:`,
              error,
            );
            return null;
          }
        });

        const imageResults = await Promise.all(imagePromises);
        const successfulImages = imageResults.filter((img) => img !== null);
        debugLog(
          `[createPost] Successfully created ${successfulImages.length} out of ${postData.images.length} images`,
        );
        if (successfulImages.length > 0) {
          invalidatePostImagesCache();
        }
      } else {
        debugLog("[createPost] No images to create");
      }

      // Enrich post with category and seller names before transforming
      const enrichedPost = await enrichPostsWithCategoryAndSeller([
        response.data,
      ]);
      const enrichedPostData = enrichedPost[0] || response.data;

      // Preserve location and area from postData (not stored in backend yet)
      enrichedPostData.Location =
        postData.location || postData.city || "Jordan";
      enrichedPostData.Area = postData.area || null;

      const product = transformPostModelToProduct(
        enrichedPostData,
        savedImageUrls.length > 0 ? savedImageUrls : postData.images || [],
      );
      return {
        success: true,
        post: product,
      };
    }

    let errorMessage = "Failed to create post";
    if (!response.success) {
      if ("error" in response) {
        errorMessage = response.error?.message || "Failed to create post";
      }
    }
    return {
      success: false,
      message: errorMessage,
    };
  },

  /**
   * Update existing post
   */
  updatePost: async (postData: UpdatePostRequest): Promise<PostResponse> => {
    // Get current post to preserve fields
    const currentPostResponse = await apiRequest<any>(`/posts/${postData.id}`, {
      method: "GET",
    });
    if (!currentPostResponse.success || !currentPostResponse.data) {
      return { success: false, message: "Post not found" };
    }

    const currentPost = currentPostResponse.data;
    const resolvedDescription =
      postData.description !== undefined
        ? postData.description
        : currentPost.PostDescription ?? "";
    const resolvedCityRaw =
      postData.location ?? postData.city ?? currentPost.City ?? "Jordan";
    const resolvedCity =
      typeof resolvedCityRaw === "string" && resolvedCityRaw.trim()
        ? resolvedCityRaw.trim()
        : "Jordan";
    const resolvedArea =
      postData.area !== undefined
        ? postData.area?.trim() || null
        : currentPost.Area ?? null;
    const currentStatusNumber = Number(currentPost.Status);
    const fallbackStatus = Number.isFinite(currentStatusNumber)
      ? currentStatusNumber
      : 0;
    const resolvedStatus =
      typeof postData.status === "string"
        ? (() => {
            switch (postData.status.trim().toUpperCase()) {
              case "ACTIVE":
                return 0;
              case "BLOCKED":
                return 1;
              case "INACTIVE":
              case "DELETED":
                return 2;
              case "SOLD":
                return 3;
              default:
                return fallbackStatus;
            }
          })()
        : fallbackStatus;

    // Find category ID if category name provided
    let categoryId = currentPost.CategoryID;
    if (postData.category) {
      const categoriesResponse = await apiRequest<any[]>("/categories/All", {
        method: "GET",
      });
      const categories = categoriesResponse.success
        ? categoriesResponse.data || []
        : [];
      const category = categories.find(
        (cat: any) =>
          cat.CategoryName?.toLowerCase() ===
          (postData.category || "").toLowerCase(),
      );
      if (category) categoryId = category.CategoryID;
    }

    // Map frontend format to backend PostModel format
    // IMPORTANT: Preserve UserID from current post to prevent ownership changes
    const backendPost = {
      PostID: parseInt(postData.id),
      UserID: currentPost.UserID || currentPost.userID, // Preserve original owner
      CategoryID: categoryId,
      PostTitle: postData.title || currentPost.PostTitle || "",
      PostDescription: resolvedDescription,
      Price:
        postData.price !== undefined ? postData.price : currentPost.Price || 0,
      Status: resolvedStatus,
      CreatedAt:
        currentPost.CreatedAt ||
        currentPost.createdAt ||
        new Date().toISOString(),
      IsDeleted:
        currentPost.IsDeleted !== undefined ? currentPost.IsDeleted : false,
      City: resolvedCity,
      Area: resolvedArea,
    };

    const response = await apiRequest<any>(`/posts/${postData.id}`, {
      method: "PUT",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      // Update images if provided
      if (postData.images) {
        const sanitizedImages = postData.images
          .map((imageUrl) => imageUrl.trim())
          .filter((imageUrl) => imageUrl.length > 0);

        // Delete old images
        const allImages = await getAllPostImages();
        const postImages = allImages.filter(
          (img: any) => img.PostID?.toString() === postData.id,
        );

        for (const img of postImages) {
          await apiRequest(`/TbPostImages/${img.PostImageID}`, {
            method: "DELETE",
          });
        }

        // Add new images
        for (const imageUrl of sanitizedImages) {
          await apiRequest("/TbPostImages", {
            method: "POST",
            body: JSON.stringify({
              PostID: parseInt(postData.id),
              PostImageURL: imageUrl,
              UploadedAt: new Date().toISOString(),
              IsDeleted: false,
            }),
          });
        }

        invalidatePostImagesCache();
      }

      const product = transformPostModelToProduct(
        response.data,
        postData.images
          ? postData.images
              .map((imageUrl) => imageUrl.trim())
              .filter((imageUrl) => imageUrl.length > 0)
          : [],
      );
      return {
        success: true,
        post: product,
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to update post",
    };
  },

  /**
   * Update post status (ACTIVE, SOLD, DELETED)
   */
  updatePostStatus: async (
    data: UpdatePostStatusRequest,
  ): Promise<PostResponse> => {
    // Map frontend status to backend format
    const statusMap: Record<string, string> = {
      ACTIVE: "ACTIVE",
      SOLD: "SOLD",
      DELETED: "INACTIVE",
    };

    const response = await apiRequest<any>(`/posts/${data.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ Status: statusMap[data.status] || "ACTIVE" }),
    });

    if (response.success && response.data) {
      const product = transformPostModelToProduct(response.data);
      return {
        success: true,
        post: product,
      };
    }

    return {
      success: false,
      message:
        (response as any).error?.message || "Failed to update post status",
    };
  },

  /**
   * Delete post
   */
  deletePost: async (
    id: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      debugLog("[deletePost] Attempting to delete post with ID:", id);

      // Use /posts/ route (matches backend UserPostsController route)
      const response = await apiRequest<any>(`/posts/${id}`, {
        method: "DELETE",
      });

      debugLog("[deletePost] Full response object:", response);
      debugLog("[deletePost] Response success:", response.success);
      if (!response.success) {
        debugLog("[deletePost] Response error:", response.error);
      } else {
        debugLog("[deletePost] Response data:", response.data);
      }

      // Backend returns Ok() with message (plain text), so success is true if status is 200
      // The apiRequest function handles plain text responses and sets success: true
      if (response.success) {
        debugLog("[deletePost] Delete successful!");
        invalidatePostImagesCache();
        return { success: true };
      }

      // Extract error message from response
      let errorMessage = "Failed to delete post";

      if (response.error) {
        errorMessage =
          response.error.message || `Error ${response.error.code || "unknown"}`;
      }

      debugError("[deletePost] Delete failed!");
      debugError("[deletePost] Error message:", errorMessage);
      debugError(
        "[deletePost] Full response JSON:",
        JSON.stringify(response, null, 2),
      );

      return { success: false, error: errorMessage };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the post";
      debugError("[deletePost] Exception caught:", error);
      debugError("[deletePost] Error details:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get posts by user ID
   */
  getUserPosts: async (userId: string): Promise<Product[]> => {
    const response = await apiRequest<any[]>(`/posts/user/${userId}`, {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const allImages = await getAllPostImages();
      const imagesByPostId = groupImagesByPostId(allImages);

      return response.data.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          imagesByPostId[post.PostID?.toString() || ""] || [],
          index,
        ),
      );
    }

    return [];
  },

  /**
   * Get posts by category
   */
  getPostsByCategory: async (
    category: string,
    page: number = 1,
  ): Promise<PostsListResponse> => {
    // Find category ID by name or use as ID
    let categoryId = parseInt(category);
    if (isNaN(categoryId)) {
      const categoriesResponse = await apiRequest<any[]>("/categories/All", {
        method: "GET",
      });
      const categories = categoriesResponse.success
        ? categoriesResponse.data || []
        : [];
      const cat = categories.find(
        (c: any) => c.CategoryName?.toLowerCase() === category.toLowerCase(),
      );
      if (cat) categoryId = cat.CategoryID;
      else
        return {
          success: false,
          posts: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalPosts: 0,
            postsPerPage: 20,
          },
        };
    }

    const response = await apiRequest<any[]>(`/posts/category/${categoryId}`, {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const allImages = await getAllPostImages();
      const imagesByPostId = groupImagesByPostId(allImages);

      const posts = response.data.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          imagesByPostId[post.PostID?.toString() || ""] || [],
          index,
        ),
      );

      return {
        success: true,
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(posts.length / 20),
          totalPosts: posts.length,
          postsPerPage: 20,
        },
      };
    }

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: 20,
      },
    };
  },

  /**
   * Track post view (analytics)
   */
  trackView: async (postId: string): Promise<boolean> => {
    const response = await apiRequest(`/posts/${postId}/views`, { method: "POST" });
    return response.success;
  },

  /**
   * Check if post exists
   */
  exists: async (postId: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/posts/Exists/${postId}`, {
      method: "GET",
    });
    return response.success ? Boolean(response.data) : false;
  },
};

// ============================================================================
// Categories API
// ============================================================================

export const categoriesApi = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiRequest<any[]>("/categories/All", {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const categories = response.data.map((cat: any, index: number) =>
        transformCategoryModelToCategory(cat, index),
      );
      return {
        success: true,
        categories,
      };
    }

    return { success: false, categories: [] };
  },

  /**
   * Get category by ID
   */
  getCategory: async (id: string): Promise<any | null> => {
    const response = await apiRequest<any>(`/categories/${id}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      return transformCategoryModelToCategory(response.data);
    }

    return null;
  },

  /**
   * Create new category
   */
  createCategory: async (data: {
    name: string;
    nameAr: string;
    icon?: string;
    color?: string;
    image?: string;
  }): Promise<{ success: boolean; category?: any; message?: string }> => {
    // Map to backend format
    const backendCategory = {
      CategoryName: data.name,
      NameAr: data.nameAr || data.name,
      Icon: data.icon || "box",
      Color: data.color || "#0A4ABF",
      Image: data.image || "",
    };

    const response = await apiRequest<any>("/categories", {
      method: "POST",
      body: JSON.stringify(backendCategory),
    });

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to create category",
    };
  },

  /**
   * Update category
   */
  updateCategory: async (
    id: string,
    data: {
      name?: string;
      nameAr?: string;
      icon?: string;
      color?: string;
      image?: string;
    },
  ): Promise<{ success: boolean; category?: any; message?: string }> => {
    // Backend likely expects full object, so ideally fetch then update
    // For now, implementing direct update with available fields

    const backendCategory = {
      CategoryID: parseInt(id),
      CategoryName: data.name,
      NameAr: data.nameAr,
      Icon: data.icon,
      Color: data.color,
      Image: data.image,
    };

    const response = await apiRequest<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(backendCategory),
    });

    if (response.success && response.data) {
      return {
        success: true,
        category: transformCategoryModelToCategory(response.data),
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to update category",
    };
  },

  /**
   * Delete category
   */
  deleteCategory: async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest(`/categories/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to delete category",
    };
  },

  /**
   * Check if category exists
   */
  exists: async (id: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/categories/Exists/${id}`, {
      method: "GET",
    });
    return response.success ? Boolean(response.data) : false;
  },
};

// ============================================================================
// Favorites API
// ============================================================================

export const favoritesApi = {
  /**
   * Get user's favorites
   */
  getFavorites: async (): Promise<string[]> => {
    const response = await apiRequest<{
      success?: boolean;
      favorites?: Array<string | number>;
    }>("/favorites", {
      method: "GET",
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to load favorites");
    }

    if (
      response.data &&
      response.data.success === true &&
      Array.isArray(response.data.favorites)
    ) {
      return response.data.favorites
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);
    }

    throw new Error("Invalid favorites response");
  },

  /**
   * Add post to favorites
   */
  addFavorite: async (postId: string): Promise<boolean> => {
    const normalizedPostId = String(postId).trim();
    if (!normalizedPostId) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean }>("/favorites", {
      method: "POST",
      body: JSON.stringify({ postId: normalizedPostId }),
    });

    return response.success && response.data?.success === true;
  },

  /**
   * Remove post from favorites
   */
  removeFavorite: async (postId: string): Promise<boolean> => {
    const normalizedPostId = String(postId).trim();
    if (!normalizedPostId) {
      return false;
    }

    const response = await apiRequest<{ success?: boolean }>(
      `/favorites/${normalizedPostId}`,
      {
        method: "DELETE",
      },
    );

    return response.success && response.data?.success === true;
  },
};

// ============================================================================
// Sellers API
// ============================================================================

export const sellersApi = {
  /**
   * Get seller profile with posts
   */
  getSellerProfile: async (
    sellerId: string,
  ): Promise<SellerProfileResponse | null> => {
    const normalizedSellerId = String(sellerId).trim();
    if (!normalizedSellerId) {
      return null;
    }

    const backendResponse = await apiRequest<SellerProfileResponse>(
      `/sellers/${normalizedSellerId}`,
      {
        method: "GET",
      },
    );
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data;
    }

    return null;
  },

  /**
   * Get top sellers
   */
  getTopSellers: async () => {
    const backendResponse = await apiRequest<any[]>("/sellers/top", {
      method: "GET",
    });
    if (backendResponse.success && Array.isArray(backendResponse.data)) {
      return backendResponse.data;
    }

    return [];
  },
};

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
  /**
   * Get user profile by ID
   */
  getUser: async (userId: string) => {
    const response = await apiRequest<any>(`/users/${userId}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      const user = response.data;
      const resolvedId = (
        user.Id ||
        user.id ||
        user.UserID ||
        user.userID ||
        userId
      ).toString();
      const joinedDate =
        user.JoinedDate ||
        user.joinedDate ||
        user.JoinDate ||
        user.joinDate ||
        new Date().toISOString();

      return {
        UserID: parseInt(resolvedId, 10) || parseInt(userId, 10),
        id: resolvedId,
        Email: user.Email || user.email || "",
        FirstName: user.FirstName || user.firstName || "",
        LastName: user.LastName || user.lastName || "",
        JoinDate: joinedDate,
        JoinedDate: joinedDate,
        Status: user.Status ?? user.status ?? 1,
        RoleID: user.RoleID ?? user.roleID ?? 2,
        IsDeleted: user.IsDeleted || user.isDeleted || false,
        // Also include transformed fields for frontend use
        firstName: user.FirstName || user.firstName || "",
        lastName: user.LastName || user.lastName || "",
        email: user.Email || user.email || "",
        phone: user.Phone || user.phone || "",
        city: user.City || user.city || "",
        area: user.Area || user.area || "",
        bio: user.Bio || user.bio || "",
        avatar: user.Avatar || user.avatar || undefined,
        joinedDate: toIsoStringOrNow(joinedDate),
        joinedAt: toIsoStringOrNow(joinedDate),
        name: `${user.FirstName || user.firstName || ""} ${
          user.LastName || user.lastName || ""
        }`.trim(),
      };
    }

    return null;
  },

  /**
   * Update user profile
   */
  updateUser: async (userId: string, userData: any) => {
    debugLog("[updateUser] Updating user:", userId, userData);
    debugLog(
      "[updateUser] User data being sent:",
      JSON.stringify(userData, null, 2),
    );

    const response = await apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    debugLog("[updateUser] Response:", response);
    debugLog("[updateUser] Response success:", response.success);

    if (response.success) {
      // TypeScript knows response.data exists when success is true
      const data = (response as { success: true; data: any }).data;
      debugLog("[updateUser] Response data:", data);
      debugLog("[updateUser] Update successful");
      return data;
    } else {
      // TypeScript knows response.error exists when success is false
      const errorResponse = response as { success: false; error: any };
      const errorMessage =
        errorResponse.error?.message || "Failed to update user";
      debugError("[updateUser] Failed:", errorMessage);
      debugError("[updateUser] Full response:", response);
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all users (Admin only)
   */
  getAllUsers: async (): Promise<{ success: boolean; users: any[] }> => {
    if (!isCurrentSessionAdmin()) {
      return { success: false, users: [] };
    }

    // Using common endpoint /users/All which likely returns all users
    const response = await apiRequest<any[]>("/users/All", {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      // Transform users
      const users = response.data.map((user: any) => ({
        rawStatus: user.Status ?? user.status ?? 1,
        isDeleted: Boolean(user.IsDeleted ?? user.isDeleted ?? false),
        id: (user.UserID || user.userID || user.Id || user.id || "").toString(),
        name: `${user.FirstName || user.firstName || ""} ${
          user.LastName || user.lastName || ""
        }`.trim(),
        email: user.Email || user.email || "",
        role: (user.RoleID ?? user.roleID) === 1 ? "admin" : "user",
        status:
          (user.Status ?? user.status) === 1 &&
          !(user.IsDeleted ?? user.isDeleted ?? false)
            ? "active"
            : "banned",
        joinedDate:
          user.JoinedDate ||
          user.joinedDate ||
          user.JoinDate ||
          user.joinDate ||
          new Date().toISOString(),
        firstName: user.FirstName || user.firstName || "",
        lastName: user.LastName || user.lastName || "",
        phone: user.Phone || user.phone || "",
        city: user.City || user.city || "",
        avatar: user.Avatar || user.avatar || undefined,
        // Keep raw data for updates
        raw: user,
      }));

      return { success: true, users };
    }

    return { success: false, users: [] };
  },

  /**
   * Create user (Admin only)
   */
  createUser: async (userData: any): Promise<{ success: boolean; user?: any; message?: string }> => {
    const password = String(userData?.Password ?? userData?.password ?? "").trim();
    const email = String(userData?.Email ?? userData?.email ?? "").trim().toLowerCase();
    const firstName = String(userData?.FirstName ?? userData?.firstName ?? "").trim();

    if (!password || !email || !firstName) {
      return {
        success: false,
        message: "Password, email, and first name are required",
      };
    }

    const payload = {
      Password: password,
      Email: email,
      FirstName: firstName,
      LastName: String(userData?.LastName ?? userData?.lastName ?? "").trim(),
      Phone:
        userData?.Phone === null || userData?.phone === null
          ? null
          : String(userData?.Phone ?? userData?.phone ?? "").trim() || null,
      JoinDate: userData?.JoinDate ?? userData?.joinDate ?? new Date().toISOString(),
      Status:
        Number.isInteger(Number(userData?.Status ?? userData?.status))
          ? Number(userData?.Status ?? userData?.status)
          : 1,
      RoleID:
        Number.isInteger(Number(userData?.RoleID ?? userData?.roleID))
          ? Number(userData?.RoleID ?? userData?.roleID)
          : 2,
      IsDeleted: Boolean(userData?.IsDeleted ?? userData?.isDeleted ?? false),
    };

    const response = await apiRequest<any>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response.success) {
      return { success: true, user: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to create user",
    };
  },

  /**
   * Delete user (self or admin)
   */
  deleteUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest<any>(`/users/${userId}`, {
      method: "DELETE",
    });

    if (response.success) {
      return {
        success: true,
        message:
          (response.data as any)?.message || "User deleted successfully",
      };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete user",
    };
  },

  /**
   * Check if user exists
   */
  exists: async (userId: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/users/Exists/${userId}`, {
      method: "GET",
    });
    return response.success ? Boolean(response.data) : false;
  },

  /**
   * Update user status (Admin only)
   */
  updateUserStatus: async (
    userId: string,
    status: "active" | "banned",
  ): Promise<boolean> => {
    // Fetch user first to satisfy backend validation (email + first name required)
    const user = await usersApi.getUser(userId);

    if (user) {
      const email = user.Email || user.email;
      const firstName = user.FirstName || user.firstName;
      const lastName = user.LastName || user.lastName || "";

      if (!email || !firstName) {
        debugError("Failed to update user status: missing required fields");
        return false;
      }

      // Status: 1 = Active, 2 = Banned
      const newStatus = status === "active" ? 1 : 2;

      try {
        await usersApi.updateUser(userId, {
          Status: newStatus,
          IsDeleted: status === "active" ? false : (user.IsDeleted ?? false),
          FirstName: firstName,
          LastName: lastName,
          Email: email,
        });
        return true;
      } catch (error) {
        debugError("Failed to update user status:", error);
        return false;
      }
    }
    return false;
  },

  /**
   * Update user role (Admin only)
   */
  updateUserRole: async (
    userId: string,
    role: "admin" | "user",
  ): Promise<boolean> => {
    const user = await usersApi.getUser(userId);

    if (user) {
      const email = user.Email || user.email;
      const firstName = user.FirstName || user.firstName;
      const lastName = user.LastName || user.lastName || "";

      if (!email || !firstName) {
        debugError("Failed to update user role: missing required fields");
        return false;
      }

      // RoleID: 1 = Admin, 2 = User
      const newRole = role === "admin" ? 1 : 2;

      try {
        await usersApi.updateUser(userId, {
          RoleID: newRole,
          FirstName: firstName,
          LastName: lastName,
          Email: email,
        });
        return true;
      } catch (error) {
        debugError("Failed to update user role:", error);
        return false;
      }
    }
    return false;
  },
};

// ============================================================================
// Post Images API
// ============================================================================

export const postImagesApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiRequest<any[]>("/TbPostImages/All", {
      method: "GET",
    });
    return response.success && Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string): Promise<any | null> => {
    const response = await apiRequest<any>(`/TbPostImages/${id}`, {
      method: "GET",
    });
    return response.success ? response.data : null;
  },

  create: async (payload: {
    PostID: number;
    PostImageURL: string;
    UploadedAt?: string;
    IsDeleted?: boolean;
  }): Promise<{ success: boolean; image?: any; message?: string }> => {
    const response = await apiRequest<any>("/TbPostImages", {
      method: "POST",
      body: JSON.stringify({
        PostID: payload.PostID,
        PostImageURL: payload.PostImageURL,
        UploadedAt: payload.UploadedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      invalidatePostImagesCache();
      return { success: true, image: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to create post image",
    };
  },

  update: async (
    id: string,
    payload: {
      PostID: number;
      PostImageURL: string;
      UploadedAt?: string;
      IsDeleted?: boolean;
    },
  ): Promise<{ success: boolean; image?: any; message?: string }> => {
    const response = await apiRequest<any>(`/TbPostImages/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        PostImageID: Number(id),
        PostID: payload.PostID,
        PostImageURL: payload.PostImageURL,
        UploadedAt: payload.UploadedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      invalidatePostImagesCache();
      return { success: true, image: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to update post image",
    };
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest<any>(`/TbPostImages/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      invalidatePostImagesCache();
      return {
        success: true,
        message:
          (response.data as any)?.message || "Post image deleted successfully",
      };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete post image",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/TbPostImages/Exists/${id}`, {
      method: "GET",
    });
    return response.success ? Boolean(response.data) : false;
  },
};

// ============================================================================
// Roles API
// ============================================================================

export const rolesApi = {
  getRoles: async (): Promise<any[]> => {
    const response = await apiRequest<any[]>("/TbRoles/All", { method: "GET" });
    return response.success && Array.isArray(response.data) ? response.data : [];
  },

  getRole: async (id: string): Promise<any | null> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, { method: "GET" });
    return response.success ? response.data : null;
  },

  createRole: async (payload: {
    RoleName: string;
    CreatedAt?: string;
    IsDeleted?: boolean;
  }): Promise<{ success: boolean; role?: any; message?: string }> => {
    const response = await apiRequest<any>("/TbRoles", {
      method: "POST",
      body: JSON.stringify({
        RoleName: payload.RoleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      return { success: true, role: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to create role",
    };
  },

  updateRole: async (
    id: string,
    payload: {
      RoleName: string;
      CreatedAt?: string;
      IsDeleted?: boolean;
    },
  ): Promise<{ success: boolean; role?: any; message?: string }> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        RoleID: Number(id),
        RoleName: payload.RoleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      return { success: true, role: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to update role",
    };
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      return {
        success: true,
        message: (response.data as any)?.message || "Role deleted successfully",
      };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete role",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/TbRoles/Exists/${id}`, {
      method: "GET",
    });
    return response.success ? Boolean(response.data) : false;
  },
};

// ============================================================================
// Reviews API
// ============================================================================

export const reviewsApi = {
  getUserReviews: async (userId: string): Promise<any[]> => {
    const response = await apiRequest<any[]>(`/reviews/user/${userId}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  },

  addReview: async (payload: {
    reviewedUserId: number;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> => {
    const response = await apiRequest<any>("/reviews", {
      method: "POST",
      body: JSON.stringify({
        ReviewID: null,
        ReviewerID: 0,
        ReviewedUserID: payload.reviewedUserId,
        Rating: payload.rating,
        Comment: payload.comment,
        Timestamp: new Date().toISOString(),
      }),
    });

    if (response.success) {
      return { success: true, data: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to submit review",
    };
  },
};

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
  getRecentChats: async (): Promise<Message[]> => {
    const response = await apiRequest<any[]>("/chat/recent", {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data.map(normalizeMessage);
    }

    return [];
  },

  getChatHistory: async (otherUserId: number): Promise<Message[]> => {
    const response = await apiRequest<any[]>(`/chat/history/${otherUserId}`, {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data.map(normalizeMessage);
    }

    return [];
  },

  getPresence: async (otherUserId: number): Promise<boolean> => {
    const response = await apiRequest<any>(`/chat/presence/${otherUserId}`, {
      method: "GET",
    });

    if (!response.success || !response.data) {
      return false;
    }

    return Boolean(
      (response.data as any).isOnline ??
        (response.data as any).IsOnline ??
        false,
    );
  },

  sendMessage: async (
    receiverId: number,
    content: string,
    postId?: number,
  ): Promise<Message | null> => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return null;
    }

    const response = await apiRequest<any>("/chat/send", {
      method: "POST",
      body: JSON.stringify({
        ReceiverId: receiverId,
        Content: trimmedContent,
        PostId: postId ?? null,
      }),
    });

    if (response.success && response.data) {
      return normalizeMessage(response.data);
    }

    return null;
  },
};

// ============================================================================
// Search API
// ============================================================================

export const searchApi = {
  /**
   * Search posts with filters
   */
  search: async (params: SearchRequest): Promise<PostsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.query?.trim()) {
      queryParams.set("query", params.query.trim());
    }
    if (params.category?.trim()) {
      queryParams.set("category", params.category.trim());
    }
    if (params.city?.trim()) {
      queryParams.set("city", params.city.trim());
    }
    if (typeof params.minPrice === "number") {
      queryParams.set("minPrice", String(params.minPrice));
    }
    if (typeof params.maxPrice === "number") {
      queryParams.set("maxPrice", String(params.maxPrice));
    }
    if (params.status) {
      queryParams.set("status", params.status);
    }
    if (params.sortBy) {
      queryParams.set("sortBy", params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.set("sortOrder", params.sortOrder);
    }
    queryParams.set("page", String(params.page && params.page > 0 ? params.page : 1));
    queryParams.set("limit", String(params.limit && params.limit > 0 ? params.limit : 20));

    const queryString = queryParams.toString();
    const response = await apiRequest<{
      success?: boolean;
      posts?: any[];
      pagination?: {
        currentPage?: number;
        totalPages?: number;
        totalPosts?: number;
        postsPerPage?: number;
      };
    }>(`/search${queryString ? `?${queryString}` : ""}`, { method: "GET" });

    if (response.success && response.data && Array.isArray(response.data.posts)) {
      const posts = response.data.posts.map((post, index) =>
        transformPostModelToProduct(post, post?.images || post?.Images || [], index),
      );

      return {
        success: true,
        posts,
        pagination: {
          currentPage: Number(response.data.pagination?.currentPage || params.page || 1),
          totalPages: Number(response.data.pagination?.totalPages || 0),
          totalPosts: Number(response.data.pagination?.totalPosts || posts.length),
          postsPerPage: Number(
            response.data.pagination?.postsPerPage || params.limit || 20,
          ),
        },
      };
    }

    const responseError = response.success ? undefined : response.error;

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: params.page && params.page > 0 ? params.page : 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: params.limit && params.limit > 0 ? params.limit : 20,
      },
      error: {
        message: responseError?.message || "Search request failed",
        code: responseError?.code,
      },
    };
  },
};

// ============================================================================
// Export all APIs
// ============================================================================

export const api = {
  auth: authApi,
  posts: postsApi,
  categories: categoriesApi,
  postImages: postImagesApi,
  roles: rolesApi,
  favorites: favoritesApi,
  sellers: sellersApi,
  users: usersApi,
  reviews: reviewsApi,
  chat: chatApi,
  search: searchApi,
  admin: {
    getStats: async () => {
      // Aggregate stats from other endpoints
      try {
        const [postsData, usersData] = await Promise.all([
          postsApi.getPosts(),
          usersApi.getAllUsers(),
        ]);

        const totalPosts = postsData.success ? postsData.posts.length : 0;
        const activeListings = postsData.success
          ? postsData.posts.filter((post) => post.status === "ACTIVE").length
          : 0;
        const totalUsers = usersData.success ? usersData.users.length : 0;

        return {
          totalUsers,
          totalPosts,
          activeListings,
          totalRevenue: 0,
        };
      } catch (error) {
        debugError("Failed to fetch admin stats:", error);
        return {
          totalUsers: 0,
          totalPosts: 0,
          activeListings: 0,
          totalRevenue: 0,
        };
      }
    },
  },
};

export default api;

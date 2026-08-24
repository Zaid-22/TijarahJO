import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest, debugError, debugLog } from "./client";
import { locationsApi } from "./locations";
import { readString, toIntegerOrDefault, toRecord } from "./normalizers";
import { parseUsersCollection } from "./schemas/userSchema";
import { resolveCityId, resolveAreaId } from "./posts/lookups";
import {
  type AdminUserRecord,
  type MutableUserFields,
  type RawUser,
  type UserProfileRecord,
  normalizeAdminUser,
  normalizeUserProfile,
  resolveMutableUserFields,
} from "./users.shared";

export type { AdminUserRecord } from "./users.shared";

type DeleteUserResponse = {
  message?: unknown;
  Message?: unknown;
};

const DEFAULT_ACTIVE_STATUS = 1;
const DEFAULT_USER_ROLE_ID = 2;

function normalizeUserId(userId: string): number | undefined {
  return toPositiveIntegerId(userId);
}

function hasMatchingUserIdentity(
  user: RawUser,
  expectedUserId: number,
): boolean {
  const responseUserId = toPositiveIntegerId(
    user.Id ?? user.id ?? user.UserID ?? user.userID,
  );
  return responseUserId === expectedUserId;
}

async function updateUserWithAdminPatch(
  userId: string,
  patch: Record<string, unknown>,
  operationName: string,
  preloadedMutableFields?: MutableUserFields,
): Promise<boolean> {
  const mutableFields =
    preloadedMutableFields ??
    resolveMutableUserFields(await usersApi.getUser(userId));
  if (!mutableFields) {
    debugError(`Failed to ${operationName}: missing required fields`);
    return false;
  }

  try {
    await usersApi.updateUser(userId, {
      FirstName: mutableFields.firstName,
      LastName: mutableFields.lastName,
      Email: mutableFields.email,
      ...patch,
    });
    return true;
  } catch (error) {
    debugError(`Failed to ${operationName}:`, error);
    return false;
  }
}

// In-flight deduplication — prevents concurrent duplicate requests to the user profile endpoint
const _userInflight: Map<number, Promise<UserProfileRecord | null>> = new Map();

export const usersApi = {
  /**
   * Get user profile by ID
   */
  getUser: async (userId: string) => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      throw new Error("Invalid user ID");
    }

    let inflight = _userInflight.get(normalizedUserId);
    if (inflight) {
      return inflight;
    }

    inflight = (async () => {
      const response = await apiRequest<RawUser>(`/users/${normalizedUserId}`, {
        method: "GET",
      });

      if (response.success && response.data) {
        const rawUser = response.data;
        if (!hasMatchingUserIdentity(rawUser, normalizedUserId)) {
          throw new Error("Invalid user profile response");
        }
        
        // Resolve City and Area IDs to names if they are present but names are missing
        const cityId = rawUser.CityId ?? rawUser.cityId;
        const areaId = rawUser.AreaId ?? rawUser.areaId;
        
        if (typeof cityId === 'number' && typeof rawUser.City !== 'string') {
          try {
            const cities = await locationsApi.getCities();
            const city = cities.find((c) => c.cityId === cityId);
            if (city) {
              rawUser.City = city.cityName;
              
              if (typeof areaId === 'number' && typeof rawUser.Area !== 'string') {
                const areas = await locationsApi.getAreasByCity(cityId);
                const area = areas.find((a) => a.areaId === areaId);
                if (area) {
                  rawUser.Area = area.areaName;
                }
              }
            }
          } catch (err) {
            debugError("[getUser] Failed to resolve location names:", err);
          }
        }

        const normalizedUser = normalizeUserProfile(
          rawUser,
          String(normalizedUserId),
        );
        if (!normalizedUser) {
          throw new Error("Invalid user profile response");
        }

        return normalizedUser;
      }

      if (!response.success && response.error.code === "HTTP_404") {
        return null;
      }

      throw new Error(
        response.success
          ? "Invalid user profile response"
          : response.error.message || "Failed to load user profile",
      );
    })().finally(() => {
      _userInflight.delete(normalizedUserId);
    });

    _userInflight.set(normalizedUserId, inflight);
    return inflight;
  },

  /**
   * Update user profile
   */
  updateUser: async (userId: string, userData: unknown) => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      throw new Error("Invalid user ID");
    }

    debugLog("[updateUser] Updating user:", normalizedUserId, userData);
    debugLog(
      "[updateUser] User data being sent:",
      JSON.stringify(userData, null, 2),
    );

    const response = await apiRequest<RawUser>(`/users/${normalizedUserId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    debugLog("[updateUser] Response:", response);
    debugLog("[updateUser] Response success:", response.success);

    if (response.success) {
      debugLog("[updateUser] Response data:", response.data);
      debugLog("[updateUser] Update successful");
      return response.data;
    }

    const errorMessage = response.error?.message || "Failed to update user";
    debugError("[updateUser] Failed:", errorMessage);
    debugError("[updateUser] Full response:", response);
    throw new Error(errorMessage);
  },

  /**
   * Upload user avatar image file
   */
  uploadAvatar: async (userId: string, file: File): Promise<{ avatarUrl: string }> => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      throw new Error("Invalid user ID");
    }

    // Validate client-side before uploading to avoid a silent Nginx 413 rejection.
    const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_AVATAR_BYTES) {
      throw new Error(
        `Avatar image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
      );
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed (JPG, PNG, WebP, GIF).");
    }

    const formData = new FormData();
    formData.append("File", file);

    debugLog("[uploadAvatar] Uploading avatar for user:", normalizedUserId);

    const response = await apiRequest<{ AvatarUrl: string }>(`/users/${normalizedUserId}/avatar`, {
      method: "POST",
      body: formData,
    });

    if (response.success && response.data) {
      debugLog("[uploadAvatar] Upload successful:", response.data.AvatarUrl);
      return { avatarUrl: response.data.AvatarUrl };
    }

    const errorMessage = !response.success && response.error?.message
      ? response.error.message
      : "Failed to upload avatar";
    debugError("[uploadAvatar] Failed:", errorMessage);
    throw new Error(errorMessage);
  },

  /**
   * Get all users (Admin only)
   */
  getAllUsers: async (): Promise<{
    success: boolean;
    users: AdminUserRecord[];
  }> => {
    const response = await apiRequest<RawUser[]>("/users?page=1&pageSize=1000", {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      const users = parseUsersCollection(response.data)
        .map((user) => normalizeAdminUser(user.raw as RawUser))
        .filter((user): user is AdminUserRecord => user !== null);

      return { success: true, users };
    }

    return { success: false, users: [] };
  },

  /**
   * Create user (Admin only)
   */
  createUser: async (
    userData: unknown,
  ): Promise<{ success: boolean; user?: RawUser; message?: string }> => {
    const userModel = toRecord(userData);
    const password = readString(userModel.Password ?? userModel.password);
    const email = readString(userModel.Email ?? userModel.email).toLowerCase();
    const firstName = readString(userModel.FirstName ?? userModel.firstName);

    if (!password || !email || !firstName) {
      return {
        success: false,
        message: "Password, email, and first name are required",
      };
    }

    const status = toIntegerOrDefault(
      userModel.Status ?? userModel.status,
      DEFAULT_ACTIVE_STATUS,
    );
    const roleId = toIntegerOrDefault(
      userModel.RoleID ?? userModel.roleID,
      DEFAULT_USER_ROLE_ID,
      1,
    );

    const userCityString =
      userModel.City === null || userModel.city === null
        ? null
        : readString(userModel.City ?? userModel.city);
    const userAreaString =
      userModel.Area === null || userModel.area === null
        ? null
        : readString(userModel.Area ?? userModel.area);

    const cityId = userCityString
      ? await resolveCityId(userCityString)
      : undefined;
    const areaId =
      cityId && userAreaString
        ? await resolveAreaId(cityId, userAreaString)
        : undefined;

    const payload = {
      Password: password,
      Email: email,
      FirstName: firstName,
      LastName: readString(userModel.LastName ?? userModel.lastName),
      CityId: cityId,
      AreaId: areaId,
      Phone:
        userModel.Phone === null || userModel.phone === null
          ? null
          : readString(userModel.Phone ?? userModel.phone) || null,
      Bio:
        userModel.Bio === null || userModel.bio === null
          ? null
          : readString(userModel.Bio ?? userModel.bio) || null,
      Avatar:
        userModel.Avatar === null || userModel.avatar === null
          ? null
          : readString(userModel.Avatar ?? userModel.avatar) || null,
      JoinDate:
        readString(userModel.JoinDate ?? userModel.joinDate) ||
        new Date().toISOString(),
      Status: status,
      RoleID: roleId,
      IsDeleted: Boolean(userModel.IsDeleted ?? userModel.isDeleted ?? false),
    };

    const response = await apiRequest<RawUser>("/users", {
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
  deleteUser: async (
    userId: string,
  ): Promise<{ success: boolean; message?: string }> => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      return {
        success: false,
        message: "Invalid user ID",
      };
    }

    const response = await apiRequest<DeleteUserResponse>(
      `/users/${normalizedUserId}`,
      {
        method: "DELETE",
      },
    );

    if (response.success) {
      const messageCandidate = readString(
        response.data?.message ?? response.data?.Message,
      );
      return {
        success: true,
        message: messageCandidate || "User deleted successfully",
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
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      throw new Error("Invalid user ID");
    }

    const response = await apiRequest<boolean>(
      `/users/Exists/${normalizedUserId}`,
      {
        method: "GET",
      },
    );
    if (!response.success) {
      throw new Error(response.error.message || "Failed to verify user");
    }

    if (typeof response.data !== "boolean") {
      throw new Error("Invalid user existence response");
    }

    return response.data;
  },

  /**
   * Update user status (Admin only)
   */
  updateUserStatus: async (
    userId: string,
    status: "active" | "banned",
  ): Promise<boolean> => {
    const user = await usersApi.getUser(userId);
    const mutableFields = resolveMutableUserFields(user);
    if (!mutableFields) {
      debugError("Failed to update user status: missing required fields");
      return false;
    }

    const nextStatus = status === "active" ? 1 : 2;
    return updateUserWithAdminPatch(
      userId,
      {
        Status: nextStatus,
        IsDeleted: status === "active" ? false : mutableFields.isDeleted,
        ClearSuspension: status === "active" ? true : undefined,
      },
      "update user status",
      mutableFields,
    );
  },

  /**
   * Update user role (Admin only)
   */
  updateUserRole: async (
    userId: string,
    roleId: number,
  ): Promise<boolean> => {
    if (!Number.isInteger(roleId) || roleId < 1) {
      debugError("Failed to update user role: invalid role ID", roleId);
      return false;
    }

    return updateUserWithAdminPatch(
      userId,
      { RoleID: roleId },
      "update user role",
    );
  },
};

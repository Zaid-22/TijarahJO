import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest, debugError, debugLog } from "./client";
import { locationsApi } from "./locations";
import { readString, toIntegerOrDefault, toRecord } from "./normalizers";
import { parseUserSchema, parseUsersCollection } from "./schemas/userSchema";
import { resolveCityId, resolveAreaId } from "./posts/lookups";

type RawUser = {
  Id?: unknown;
  id?: unknown;
  UserID?: unknown;
  userID?: unknown;
  Email?: unknown;
  email?: unknown;
  FirstName?: unknown;
  firstName?: unknown;
  LastName?: unknown;
  lastName?: unknown;
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
  JoinDate?: unknown;
  joinDate?: unknown;
  Status?: unknown;
  status?: unknown;
  RoleID?: unknown;
  roleID?: unknown;
  IsDeleted?: unknown;
  isDeleted?: unknown;
  CityId?: unknown;
  cityId?: unknown;
  AreaId?: unknown;
  areaId?: unknown;
};

type UserProfileRecord = {
  id: string;
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
  bio: string;
  avatar?: string;
  joinedAt: string;
  status: number;
  roleId: number;
  isDeleted: boolean;
  name: string;
};

export type AdminUserRecord = {
  rawStatus: number;
  isDeleted: boolean;
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "banned";
  joinedDate: string;
  joinedAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  avatar?: string;
  raw: RawUser;
};

type DeleteUserResponse = {
  message?: unknown;
  Message?: unknown;
};

const DEFAULT_ACTIVE_STATUS = 1;
const DEFAULT_USER_ROLE_ID = 2;

function normalizeUserId(userId: string): number | undefined {
  return toPositiveIntegerId(userId);
}

function normalizeUserProfile(
  user: RawUser,
  fallbackUserId: string,
): UserProfileRecord | null {
  const parsedUser = parseUserSchema(user, fallbackUserId);
  if (!parsedUser) {
    return null;
  }

  return {
    id: parsedUser.id,
    userId: parsedUser.userId,
    email: parsedUser.email,
    firstName: parsedUser.firstName,
    lastName: parsedUser.lastName,
    phone: parsedUser.phone,
    city: parsedUser.city,
    area: parsedUser.area,
    bio: parsedUser.bio,
    avatar: parsedUser.avatar,
    joinedAt: parsedUser.joinedAt,
    status: parsedUser.status,
    roleId: parsedUser.roleId,
    isDeleted: parsedUser.isDeleted,
    name: `${parsedUser.firstName} ${parsedUser.lastName}`.trim(),
  };
}

function normalizeAdminUser(user: RawUser): AdminUserRecord | null {
  const parsedUser = parseUserSchema(user);
  if (!parsedUser) {
    return null;
  }

  return {
    rawStatus: parsedUser.status,
    isDeleted: parsedUser.isDeleted,
    id: parsedUser.id,
    name: `${parsedUser.firstName} ${parsedUser.lastName}`.trim(),
    email: parsedUser.email,
    role: parsedUser.roleId === 1 ? "admin" : "user",
    status:
      parsedUser.status === 1 && !parsedUser.isDeleted ? "active" : "banned",
    joinedDate: parsedUser.joinedDate,
    joinedAt: parsedUser.joinedAt,
    firstName: parsedUser.firstName,
    lastName: parsedUser.lastName,
    phone: parsedUser.phone,
    city: parsedUser.city,
    avatar: parsedUser.avatar,
    raw: parsedUser.raw as RawUser,
  };
}

type MutableUserFields = {
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
};

function resolveMutableUserFields(
  user: UserProfileRecord | null,
): MutableUserFields | null {
  if (!user) {
    return null;
  }

  const email = user.email;
  const firstName = user.firstName;
  if (!email || !firstName) {
    return null;
  }

  return {
    email,
    firstName,
    lastName: user.lastName || "",
    isDeleted: user.isDeleted,
  };
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

export const usersApi = {
  /**
   * Get user profile by ID
   */
  getUser: async (userId: string) => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      return null;
    }

    const response = await apiRequest<RawUser>(`/users/${normalizedUserId}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      const rawUser = response.data;
      
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

      return normalizeUserProfile(rawUser, String(normalizedUserId));
    }

    return null;
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
    const response = await apiRequest<RawUser[]>("/users", {
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
      return false;
    }

    const response = await apiRequest<boolean>(
      `/users/Exists/${normalizedUserId}`,
      {
        method: "GET",
      },
    );
    return response.success ? Boolean(response.data) : false;
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
    role: "admin" | "user",
  ): Promise<boolean> => {
    const nextRole = role === "admin" ? 1 : 2;
    return updateUserWithAdminPatch(
      userId,
      { RoleID: nextRole },
      "update user role",
    );
  },
};

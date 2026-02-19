import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest, debugError, debugLog } from "./client";
import { toIsoStringOrNow } from "./shared";

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
};

export type UserProfileRecord = {
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

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIntegerOrDefault(
  value: unknown,
  fallback: number,
  minimumValue: number = Number.MIN_SAFE_INTEGER,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < minimumValue) {
    return fallback;
  }
  return parsed;
}

function normalizeUserId(userId: string): number | undefined {
  return toPositiveIntegerId(userId);
}

function resolveRawUserId(user: RawUser, fallbackId: string): string {
  const candidates = [user.Id, user.id, user.UserID, user.userID, fallbackId];
  for (const candidate of candidates) {
    const normalized = readString(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function resolveJoinDate(user: RawUser): string {
  return (
    readString(user.JoinedDate) ||
    readString(user.joinedDate) ||
    readString(user.JoinDate) ||
    readString(user.joinDate) ||
    new Date().toISOString()
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeUserProfile(
  user: RawUser,
  fallbackUserId: string,
): UserProfileRecord | null {
  const resolvedId = resolveRawUserId(user, fallbackUserId);
  if (!resolvedId) {
    return null;
  }

  const joinedDate = resolveJoinDate(user);
  const firstName = readString(user.FirstName ?? user.firstName);
  const lastName = readString(user.LastName ?? user.lastName);
  const email = readString(user.Email ?? user.email);
  const numericUserId =
    toPositiveIntegerId(resolvedId) ?? toPositiveIntegerId(fallbackUserId);
  const status = toIntegerOrDefault(
    user.Status ?? user.status,
    DEFAULT_ACTIVE_STATUS,
  );
  const roleId = toIntegerOrDefault(
    user.RoleID ?? user.roleID,
    DEFAULT_USER_ROLE_ID,
    1,
  );

  return {
    id: resolvedId,
    userId: numericUserId,
    email,
    firstName,
    lastName,
    phone: readString(user.Phone ?? user.phone),
    city: readString(user.City ?? user.city),
    area: readString(user.Area ?? user.area),
    bio: readString(user.Bio ?? user.bio),
    avatar: readString(user.Avatar ?? user.avatar) || undefined,
    joinedAt: toIsoStringOrNow(joinedDate),
    status,
    roleId,
    isDeleted: Boolean(user.IsDeleted ?? user.isDeleted ?? false),
    name: `${firstName} ${lastName}`.trim(),
  };
}

function normalizeAdminUser(user: RawUser): AdminUserRecord | null {
  const resolvedId = resolveRawUserId(user, "");
  if (!resolvedId) {
    return null;
  }

  const firstName = readString(user.FirstName ?? user.firstName);
  const lastName = readString(user.LastName ?? user.lastName);
  const email = readString(user.Email ?? user.email);
  const roleId = toIntegerOrDefault(
    user.RoleID ?? user.roleID,
    DEFAULT_USER_ROLE_ID,
    1,
  );
  const rawStatus = toIntegerOrDefault(
    user.Status ?? user.status,
    DEFAULT_ACTIVE_STATUS,
  );
  const isDeleted = Boolean(user.IsDeleted ?? user.isDeleted ?? false);
  const joinedDate = resolveJoinDate(user);

  return {
    rawStatus,
    isDeleted,
    id: resolvedId,
    name: `${firstName} ${lastName}`.trim(),
    email,
    role: roleId === 1 ? "admin" : "user",
    status: rawStatus === 1 && !isDeleted ? "active" : "banned",
    joinedDate,
    joinedAt: joinedDate,
    firstName,
    lastName,
    phone: readString(user.Phone ?? user.phone),
    city: readString(user.City ?? user.city),
    avatar: readString(user.Avatar ?? user.avatar) || undefined,
    raw: user,
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
      return normalizeUserProfile(response.data, String(normalizedUserId));
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
   * Get all users (Admin only)
   */
  getAllUsers: async (): Promise<{ success: boolean; users: AdminUserRecord[] }> => {
    const response = await apiRequest<RawUser[]>("/users", {
      method: "GET",
    });

    if (response.success && Array.isArray(response.data)) {
      const users = response.data
        .map((user) => normalizeAdminUser(user))
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

    const payload = {
      Password: password,
      Email: email,
      FirstName: firstName,
      LastName: readString(userModel.LastName ?? userModel.lastName),
      Phone:
        userModel.Phone === null || userModel.phone === null
          ? null
          : readString(userModel.Phone ?? userModel.phone) || null,
      City:
        userModel.City === null || userModel.city === null
          ? null
          : readString(userModel.City ?? userModel.city) || null,
      Area:
        userModel.Area === null || userModel.area === null
          ? null
          : readString(userModel.Area ?? userModel.area) || null,
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
  deleteUser: async (userId: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedUserId = normalizeUserId(userId);
    if (!normalizedUserId) {
      return {
        success: false,
        message: "Invalid user ID",
      };
    }

    const response = await apiRequest<DeleteUserResponse>(`/users/${normalizedUserId}`, {
      method: "DELETE",
    });

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

    const response = await apiRequest<boolean>(`/users/Exists/${normalizedUserId}`, {
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

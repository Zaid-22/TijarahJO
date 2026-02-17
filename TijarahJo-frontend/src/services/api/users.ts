import { apiRequest, debugError, debugLog } from "./client";
import { isCurrentSessionAdmin, toIsoStringOrNow } from "./shared";

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

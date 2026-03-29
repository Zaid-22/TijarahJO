import { apiRequest, debugError } from "./client";
import type {
  AdminDashboardStats,
  AdminPostFilter,
  AdminPostListResult,
  AdminUserDetails,
  AdminReviewListResult,
  AdminAuditLogResult,
  SystemSettingItem,
  AdminConversationListResult,
  AdminConversationDetail,
  AdminCityItem,
  AdminReportListResult,
} from "./admin.types";

// Re-export all types so existing consumers don't break
export type * from "./admin.types";

export type BannerMutationResult = {
  success: boolean;
  message?: string;
};

/**
 * Recursively converts all object keys from PascalCase to camelCase.
 * The backend uses `PropertyNamingPolicy = null` which preserves PascalCase,
 * but the frontend types expect camelCase.
 */
function toCamelCaseKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCaseKeys(item)) as T;
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = toCamelCaseKeys(value);
    }
    return result as T;
  }
  return obj as T;
}

export const adminApi = {
  /**
   * Get main dashboard statistics (Admin only)
   */
  getStats: async (): Promise<AdminDashboardStats> => {
    try {
      const response = await apiRequest<AdminDashboardStats>("/admin/stats", {
        method: "GET",
      });
      if (response.success && response.data) {
        return toCamelCaseKeys<AdminDashboardStats>(response.data);
      }
      throw new Error("Failed to fetch admin stats");
    } catch (error) {
      debugError("adminApi.getStats", error);
      throw error;
    }
  },

  /**
   * Get analytics data for dashboard charts
   */
  getAnalytics: async (): Promise<{
    weeklyUsers: Record<string, unknown>[];
    categoryData: Record<string, unknown>[];
  }> => {
    try {
      const response = await apiRequest<{
        weeklyUsers: Record<string, unknown>[];
        categoryData: Record<string, unknown>[];
      }>("/admin/analytics", {
        method: "GET",
      });
      if (response.success && response.data) {
        return toCamelCaseKeys(response.data);
      }
      throw new Error("Failed to fetch admin analytics");
    } catch (error) {
      debugError("adminApi.getAnalytics", error);
      throw error;
    }
  },

  /**
   * Get paginated admin posts with optional filtering
   */
  getPosts: async (filter: AdminPostFilter): Promise<AdminPostListResult> => {
    try {
      const params = new URLSearchParams();
      if (filter.status !== undefined)
        params.append("status", filter.status.toString());
      if (filter.categoryId !== undefined)
        params.append("categoryId", filter.categoryId.toString());
      if (filter.cityId !== undefined)
        params.append("cityId", filter.cityId.toString());
      if (filter.page !== undefined)
        params.append("page", filter.page.toString());
      if (filter.pageSize !== undefined)
        params.append("pageSize", filter.pageSize.toString());

      const url = `/admin/posts${params.toString() ? "?" + params.toString() : ""}`;
      const response = await apiRequest<AdminPostListResult>(url, {
        method: "GET",
      });

      if (response.success && response.data) {
        return toCamelCaseKeys<AdminPostListResult>(response.data);
      }

      const errorMessage =
        !response.success && response.error
          ? response.error.message
          : "Failed to fetch admin posts";
      throw new Error(errorMessage);
    } catch (error) {
      debugError("Failed to fetch admin posts:", error);
      throw error;
    }
  },

  /**
   * Update the status of a post (Admin only)
   */
  updatePostStatus: async (
    postId: number,
    status: number,
  ): Promise<boolean> => {
    try {
      // Backend expects a string: ACTIVE, BLOCKED, or SOLD
      const STATUS_MAP: Record<number, string> = {
        0: "ACTIVE",
        1: "BLOCKED",
        3: "SOLD",
      };
      const statusString = STATUS_MAP[status] ?? "ACTIVE";

      const response = await apiRequest(`/admin/posts/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ Status: statusString }),
      });

      return response.success;
    } catch (error) {
      debugError(`Failed to update post status for post ${postId}:`, error);
      return false;
    }
  },

  /**
   * Get detailed profile for a specific user, including recent posts and reviews
   */
  getUserDetails: async (userId: number): Promise<AdminUserDetails | null> => {
    try {
      const response = await apiRequest<AdminUserDetails>(
        `/admin/users/${userId}/details`,
        {
          method: "GET",
        },
      );

      if (response.success && response.data) {
        return toCamelCaseKeys<AdminUserDetails>(response.data);
      }

      return null;
    } catch (error) {
      debugError(`Failed to fetch user details for user ${userId}:`, error);
      return null;
    }
  },

  // ── Phase 2: Reviews Moderation ──

  /**
   * Get paginated admin reviews
   */
  getReviews: async (
    page = 1,
    pageSize = 50,
  ): Promise<AdminReviewListResult> => {
    try {
      const response = await apiRequest<AdminReviewListResult>(
        `/admin/reviews?page=${page}&pageSize=${pageSize}`,
        { method: "GET" },
      );

      if (response.success && response.data) {
        return toCamelCaseKeys<AdminReviewListResult>(response.data);
      }

      const errorMessage =
        !response.success && response.error
          ? response.error.message
          : "Failed to fetch admin reviews";
      throw new Error(errorMessage);
    } catch (error) {
      debugError("Failed to fetch admin reviews:", error);
      throw error;
    }
  },

  /**
   * Soft-delete a review (moderation action)
   */
  deleteReview: async (reviewId: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      return response.success;
    } catch (error) {
      debugError(`Failed to delete review ${reviewId}:`, error);
      return false;
    }
  },

  // ── Phase 2: Audit Log ──

  /**
   * Get paginated audit logs with optional table name filter
   */
  getAuditLogs: async (
    tableName?: string,
    page = 1,
    pageSize = 50,
  ): Promise<AdminAuditLogResult> => {
    try {
      const params = new URLSearchParams();
      if (tableName) params.append("tableName", tableName);
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());

      const response = await apiRequest<AdminAuditLogResult>(
        `/admin/audit-logs?${params.toString()}`,
        { method: "GET" },
      );

      if (response.success && response.data) {
        return toCamelCaseKeys<AdminAuditLogResult>(response.data);
      }

      const errorMessage =
        !response.success && response.error
          ? response.error.message
          : "Failed to fetch audit logs";
      throw new Error(errorMessage);
    } catch (error) {
      debugError("Failed to fetch audit logs:", error);
      throw error;
    }
  },

  // ── Phase 3: System Settings ──

  getSettings: async (): Promise<SystemSettingItem[]> => {
    try {
      const response = await apiRequest<SystemSettingItem[]>(
        "/admin/settings",
        {
          method: "GET",
        },
      );
      if (response.success && response.data) {
        return toCamelCaseKeys<SystemSettingItem[]>(response.data);
      }
      throw new Error("Failed to fetch settings");
    } catch (error) {
      debugError("Failed to fetch settings:", error);
      throw error;
    }
  },

  updateSetting: async (key: string, value: string): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ Value: value }),
      });
      return response.success;
    } catch (error) {
      debugError(`Failed to update setting ${key}:`, error);
      return false;
    }
  },

  // ── Phase 3: Chat Inspection ──

  getConversations: async (
    page = 1,
    pageSize = 50,
  ): Promise<AdminConversationListResult> => {
    try {
      const response = await apiRequest<AdminConversationListResult>(
        `/admin/conversations?page=${page}&pageSize=${pageSize}`,
        { method: "GET" },
      );
      if (response.success && response.data) {
        return toCamelCaseKeys<AdminConversationListResult>(response.data);
      }
      throw new Error("Failed to fetch conversations");
    } catch (error) {
      debugError("Failed to fetch conversations:", error);
      throw error;
    }
  },

  getConversationMessages: async (
    conversationId: number,
  ): Promise<AdminConversationDetail | null> => {
    try {
      const response = await apiRequest<AdminConversationDetail>(
        `/admin/conversations/${conversationId}/messages`,
        { method: "GET" },
      );
      if (response.success && response.data) {
        return toCamelCaseKeys<AdminConversationDetail>(response.data);
      }
      return null;
    } catch (error) {
      debugError(
        `Failed to fetch messages for conversation ${conversationId}:`,
        error,
      );
      return null;
    }
  },

  // ── Locations CRUD ──

  getCities: async (): Promise<AdminCityItem[]> => {
    try {
      const response = await apiRequest<AdminCityItem[]>(
        "/admin/locations/cities",
        { method: "GET" },
      );
      if (response.success && response.data) return toCamelCaseKeys<AdminCityItem[]>(response.data);
      throw new Error("Failed to fetch cities");
    } catch (error) {
      debugError("Failed to fetch cities:", error);
      throw error;
    }
  },

  createCity: async (name: string): Promise<{ cityID: number }> => {
    const response = await apiRequest<{ cityID: number }>(
      "/admin/locations/cities",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
    );
    if (response.success && response.data) return response.data;
    throw new Error("Failed to create city");
  },

  updateCity: async (id: number, name: string): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/cities/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    return response.success;
  },

  deleteCity: async (id: number): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/cities/${id}`, {
      method: "DELETE",
    });
    return response.success;
  },

  createArea: async (
    cityID: number,
    name: string,
  ): Promise<{ areaID: number }> => {
    const response = await apiRequest<{ areaID: number }>(
      "/admin/locations/areas",
      {
        method: "POST",
        body: JSON.stringify({ cityID, name }),
      },
    );
    if (response.success && response.data) return response.data;
    throw new Error("Failed to create area");
  },

  updateArea: async (id: number, name: string): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/areas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    return response.success;
  },

  deleteArea: async (id: number): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/areas/${id}`, {
      method: "DELETE",
    });
    return response.success;
  },

  // ── Reports ──

  getReports: async (
    status?: number,
    reportType?: string,
    page = 1,
    pageSize = 50,
  ): Promise<AdminReportListResult> => {
    try {
      const params = new URLSearchParams();
      if (status !== undefined) params.set("status", String(status));
      if (reportType) params.set("reportType", reportType);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await apiRequest<AdminReportListResult>(
        `/admin/reports?${params.toString()}`,
        { method: "GET" },
      );
      if (response.success && response.data) return toCamelCaseKeys<AdminReportListResult>(response.data);
      throw new Error("Failed to fetch reports");
    } catch (error) {
      debugError("Failed to fetch reports:", error);
      throw error;
    }
  },

  updateReportStatus: async (
    reportId: number,
    status: number,
    resolutionNotes?: string,
  ): Promise<boolean> => {
    const response = await apiRequest(`/admin/reports/${reportId}/status`, {
      method: "PUT",
      body: JSON.stringify({ Status: status, ResolutionNotes: resolutionNotes }),
    });
    return response.success;
  },

  // ── RBAC Permissions ──

  getPermissions: async (): Promise<PermissionItem[]> => {
    try {
      const response = await apiRequest<PermissionItem[]>(
        "/admin/permissions",
        { method: "GET" },
      );
      if (response.success && response.data) return toCamelCaseKeys<PermissionItem[]>(response.data);
      throw new Error("Failed to fetch permissions");
    } catch (error) {
      debugError("adminApi.getPermissions", error);
      throw error;
    }
  },

  getRolePermissions: async (roleId: number): Promise<number[]> => {
    try {
      const response = await apiRequest<number[]>(
        `/admin/permissions/role/${roleId}`,
        { method: "GET" },
      );
      if (response.success && response.data) return response.data;
      throw new Error("Failed to fetch role permissions");
    } catch (error) {
      debugError("adminApi.getRolePermissions", error);
      throw error;
    }
  },

  updateRolePermissions: async (
    roleId: number,
    permissionIds: number[],
  ): Promise<boolean> => {
    const response = await apiRequest(`/admin/permissions/role/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({ permissionIds }),
    });
    return response.success;
  },

  // ── Bulk User Actions ──

  bulkUpdateUserStatus: async (
    userIds: string[],
    status: "banned" | "active",
  ): Promise<boolean> => {
    const response = await apiRequest("/admin/users/bulk-status", {
      method: "PUT",
      body: JSON.stringify({ userIds, status }),
    });
    return response.success;
  },

  // ── Fraud Detection ──

  getFraudSignals: async (): Promise<FraudSignalsResult> => {
    try {
      const response = await apiRequest<FraudSignalsResult>(
        "/admin/fraud/signals",
        { method: "GET" },
      );
      if (response.success && response.data) return toCamelCaseKeys<FraudSignalsResult>(response.data);
      throw new Error("Failed to fetch fraud signals");
    } catch (error) {
      debugError("adminApi.getFraudSignals", error);
      throw error;
    }
  },

  // ── Hero Banners ──

  getBanners: async (): Promise<any[]> => {
    try {
      const response = await apiRequest<any>("/admin/banners", { method: "GET" });
      if (response.success && response.data) {
        const data = toCamelCaseKeys<any>(response.data);
        if (data.success) {
          return data.banners || [];
        }
      }
      return [];
    } catch (error) {
      debugError("adminApi.getBanners", error);
      return [];
    }
  },

  createBanner: async (bannerData: any): Promise<BannerMutationResult> => {
    try {
      const response = await apiRequest("/admin/banners", {
        method: "POST",
        body: JSON.stringify(bannerData),
      });
      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        message: response.error?.message || "Failed to add banner",
      };
    } catch (error) {
      debugError("adminApi.createBanner", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add banner",
      };
    }
  },

  updateBanner: async (
    id: number,
    bannerData: any,
  ): Promise<BannerMutationResult> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(bannerData),
      });
      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        message: response.error?.message || "Failed to update banner",
      };
    } catch (error) {
      debugError("adminApi.updateBanner", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update banner",
      };
    }
  },

  deleteBanner: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}`, {
        method: "DELETE",
      });
      return response.success;
    } catch (error) {
      debugError("adminApi.deleteBanner", error);
      return false;
    }
  },

  toggleBannerActive: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/admin/banners/${id}/toggle`, {
        method: "PATCH",
      });
      return response.success;
    } catch (error) {
      debugError("adminApi.toggleBannerActive", error);
      return false;
    }
  },
};


// ── Additional Types ──

export type PermissionItem = {
  permissionID: number;
  permissionKey: string;
  description: string;
  category: string;
};

export type FraudSignal = {
  type: string;
  severity: string;
  count: number;
  detail: string;
};

export type FraudSignalsResult = {
  rapidRegistrations: boolean;
  rapidRegistrationCount: number;
  duplicateListings: number;
  suspiciousPriceCount: number;
  reviewBombingTargets: number;
  checkedAt: string;
  signals: FraudSignal[];
};

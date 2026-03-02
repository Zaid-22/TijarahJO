import { apiRequest, debugError } from "./client";

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  activeListings: number;
  blockedListings: number;
  totalCategories: number;
  newUsersThisWeek: number;
  totalReviews: number;
  averageRating: number;
  soldPosts: number;
  recentActions: RecentAdminAction[];
};

export type RecentAdminAction = {
  actorName: string;
  actionType: string;
  tableName: string;
  changedAt: string;
};

export type AdminPostFilter = {
  status?: number;
  categoryId?: number;
  cityId?: number;
  page?: number;
  pageSize?: number;
};

export type AdminPostItem = {
  postId: number;
  title: string;
  price: number | null;
  status: number;
  categoryId: number;
  categoryName: string;
  userId: number;
  sellerName: string;
  views: number;
  createdAt: string;
};

export type AdminPostListResult = {
  posts: AdminPostItem[];
  totalCount: number;
};

export type AdminUserDetails = {
  user: any; // Using any for simplicity in the wrapper, component will type it
  recentPosts: AdminPostItem[];
  recentReviews: any[];
};

// ── Phase 2 Types ──

export type AdminReviewItem = {
  reviewID: number;
  reviewerID: number;
  reviewerName: string;
  reviewedUserID: number;
  reviewedUserName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AdminReviewListResult = {
  reviews: AdminReviewItem[];
  totalCount: number;
};

export type AdminAuditLogItem = {
  auditLogID: number;
  tableName: string;
  recordID: number;
  action: string;
  changedByUserID: number | null;
  changedByUserName: string | null;
  changedAt: string;
  oldValues: string | null;
  newValues: string | null;
};

export type AdminAuditLogResult = {
  entries: AdminAuditLogItem[];
  totalCount: number;
};

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
        return response.data;
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
    weeklyUsers: any[];
    categoryData: any[];
  }> => {
    try {
      const response = await apiRequest<{
        weeklyUsers: any[];
        categoryData: any[];
      }>("/admin/analytics", {
        method: "GET",
      });
      if (response.success && response.data) {
        return response.data;
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
        return response.data;
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
      const response = await apiRequest(`/admin/posts/${postId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
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
        return response.data;
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
        return response.data;
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
        return response.data;
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
        return response.data;
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
        body: JSON.stringify({ value }),
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
        return response.data;
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
        return response.data;
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
      if (response.success && response.data) return response.data;
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
      if (response.success && response.data) return response.data;
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
      body: JSON.stringify({ status, resolutionNotes }),
    });
    return response.success;
  },
};

// ── Phase 3 Types ──

export type SystemSettingItem = {
  settingID: number;
  settingKey: string;
  label: string;
  value: string;
  valueType: string;
  description: string | null;
  updatedAt: string;
};

export type AdminConversationItem = {
  conversationID: number;
  user1ID: number;
  user1Name: string;
  user2ID: number;
  user2Name: string;
  postID: number | null;
  lastMessageAt: string | null;
  messageCount: number;
};

export type AdminConversationListResult = {
  conversations: AdminConversationItem[];
  totalCount: number;
};

export type AdminMessageItem = {
  messageID: number;
  senderID: number;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

export type AdminConversationDetail = {
  conversation: AdminConversationItem;
  messages: AdminMessageItem[];
};

export type AdminAreaItem = {
  areaID: number;
  cityID: number;
  areaName: string;
};

export type AdminCityItem = {
  cityID: number;
  cityName: string;
  areas: AdminAreaItem[];
};

export type AdminReportItem = {
  reportID: number;
  reportType: string;
  targetID: number;
  reason: string;
  description: string | null;
  reporterUserID: number;
  reporterName: string;
  status: number;
  statusLabel: string;
  resolvedByUserID: number | null;
  resolvedByName: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminReportListResult = {
  reports: AdminReportItem[];
  totalCount: number;
};

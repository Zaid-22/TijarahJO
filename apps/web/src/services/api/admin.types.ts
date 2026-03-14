// ── Admin API Types ──

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
  user: Record<string, unknown>;
  recentPosts: AdminPostItem[];
  recentReviews: Record<string, unknown>[];
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

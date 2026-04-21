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
  postID: number;
  title: string;
  price: number | null;
  status: number;
  categoryID: number;
  categoryName: string;
  userID: number;
  sellerName: string;
  views: number;
  createdAt: string;
};

export type AdminPostListResult = {
  posts: AdminPostItem[];
  totalCount: number;
};

export type AdminUserDetails = {
  user: {
    id?: number;
    userID?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cityID?: number;
    areaID?: number;
    joinDate?: string;
    joinedDate?: string;
    roleID?: number;
    status?: number;
    suspendedUntil?: string | null;
    avatar?: string;
    [key: string]: unknown;
  };
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

export type AdminPostCommentItem = {
  commentID: number;
  postID: number;
  postTitle: string;
  userID: number;
  authorName: string;
  parentCommentID: number | null;
  replyCount: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminPostCommentListResult = {
  comments: AdminPostCommentItem[];
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
  areaNameAr: string;
};

export type AdminCityItem = {
  cityID: number;
  cityName: string;
  cityNameAr: string;
  areas: AdminAreaItem[];
};

export type AdminReportItem = {
  reportID: number;
  reportType: string;
  targetID: number;
  targetLabel: string | null;
  reason: string;
  description: string | null;
  reporterUserID: number;
  reporterName: string;
  reporterEmail: string;
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

// ── RBAC Types ──

export type PermissionItem = {
  permissionID: number;
  permissionKey: string;
  description: string;
  category: string;
};

// ── Fraud Detection Types ──

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

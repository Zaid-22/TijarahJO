export const ADMIN_PERMISSIONS = {
  usersView: "users.view",
  usersManage: "users.manage",
  postsView: "posts.view",
  postsModerate: "posts.moderate",
  commentsView: "comments.view",
  commentsModerate: "comments.moderate",
  reviewsView: "reviews.view",
  reviewsModerate: "reviews.moderate",
  chatView: "chat.view",
  categoriesManage: "categories.manage",
  rolesManage: "roles.manage",
  locationsManage: "locations.manage",
  reportsView: "reports.view",
  fraudView: "fraud.view",
  bannersManage: "banners.manage",
  auditView: "audit.view",
  settingsManage: "settings.manage",
} as const;

export type AdminPermissionKey =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

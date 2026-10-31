import type { DemoRequest, DemoState } from "./types";
import type { Post } from "../types";
import { DemoError, isActiveUser, requireAdmin, requireUser } from "./store";
import { categories, cities, areas } from "./seed";
import { pageItems } from "./marketplace";

const statusNumber = (p: Post) => p.status === "SOLD" ? 3 : p.status === "DELETED" ? 1 : 0;
function adminPost(p: Post) {
  return { postID: Number(p.id), title: p.name, price: p.price, status: statusNumber(p),
    categoryID: Number(p.categoryId), categoryName: p.category, userID: Number(p.sellerId),
    sellerName: p.seller, views: p.views ?? 0, createdAt: p.createdAt };
}
function audit(state: DemoState, table: string, id: number, action: string) {
  const user = requireAdmin(state);
  state.audit.unshift({ auditLogID: state.nextId++, tableName: table, recordID: id, action,
    changedByUserID: user.Id, changedByUserName: `${user.FirstName} ${user.LastName}`,
    changedAt: new Date().toISOString(), oldValues: null, newValues: JSON.stringify({ action }) });
}
export function admin({ state, path, method, query, body, form }: DemoRequest): unknown {
  if (path === "/reports" && method === "POST") {
    const user = requireUser(state); const id = Number(form?.get("TargetID"));
    state.reports.unshift({ reportID: state.nextId++, reportType: String(form?.get("ReportType") ?? "LISTING"),
      targetID: id, targetLabel: state.posts.find(p => p.id === String(id))?.name ?? `Demo item ${id}`,
      reason: String(form?.get("Reason") ?? "OTHER"), description: String(form?.get("Description") ?? ""), imageUrl: null,
      reporterUserID: user.Id, reporterName: `${user.FirstName} ${user.LastName}`, reporterEmail: user.Email,
      targetUserID: null, targetUserName: null, targetUserStatus: null, targetUserSuspendedUntil: null,
      status: 0, statusLabel: "Pending", resolvedByUserID: null, resolvedByName: null, resolutionNotes: null,
      createdAt: new Date().toISOString(), resolvedAt: null });
    return { success: true };
  }
  if (!path.startsWith("/admin/")) return undefined;
  const user = requireAdmin(state);
  if (path === "/admin/stats" && method === "GET") return {
    totalUsers: state.users.filter(u => !u.IsDeleted).length,
    activeUsers: state.users.filter(isActiveUser).length,
    totalPosts: state.posts.length, activeListings: state.posts.filter(p => p.status === "ACTIVE").length,
    blockedListings: state.posts.filter(p => p.status === "DELETED").length,
    soldPosts: state.posts.filter(p => p.status === "SOLD").length, totalCategories: categories.length,
    newUsersThisWeek: state.users.filter(u => Date.parse(u.JoinedDate) > Date.now() - 7 * 86400000).length,
    totalReviews: state.reviews.length,
    averageRating: state.reviews.length ? Math.round(state.reviews.reduce((sum, r) => sum + r.Rating, 0) / state.reviews.length * 10) / 10 : 0,
    recentActions: state.audit.slice(0, 5).map(a => ({ actorName: a.changedByUserName, actionType: a.action, tableName: a.tableName, changedAt: a.changedAt })),
  };
  if (path === "/admin/analytics" && method === "GET") return {
    weeklyUsers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({ day, name: day, users: 0, count: 0 })),
    categoryData: categories.map(c => ({ name: c.CategoryName, count: state.posts.filter(p => p.categoryId === String(c.CategoryID) && p.status === "ACTIVE").length })),
  };
  if (path === "/admin/search" && method === "GET") {
    const q = (query.get("q") ?? "").toLowerCase();
    return {
      users: state.users.filter(u => `${u.FirstName} ${u.LastName} ${u.Email}`.toLowerCase().includes(q)).slice(0, 5).map(u => ({ id: u.Id, type: "USER", title: `${u.FirstName} ${u.LastName}`, subtitle: u.Email })),
      posts: state.posts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5).map(p => ({ id: Number(p.id), type: "LISTING", title: p.name, subtitle: p.category })),
      categories: categories.filter(c => c.CategoryName.toLowerCase().includes(q)).map(c => ({ id: c.CategoryID, type: "CATEGORY", title: c.CategoryName, subtitle: c.NameAr })),
    };
  }
  if (path === "/admin/posts" && method === "GET") {
    const posts = state.posts.filter(p => (!query.has("status") || statusNumber(p) === Number(query.get("status"))) &&
      (!query.has("categoryId") || p.categoryId === query.get("categoryId")));
    const page = pageItems(posts, query); return { posts: page.items.map(adminPost), totalCount: page.totalCount };
  }
  const postMatch = path.match(/^\/admin\/posts\/(\d+)(?:\/(status))?$/);
  if (postMatch && ["PATCH", "DELETE"].includes(method)) {
    const post = state.posts.find(p => p.id === postMatch[1]);
    if (!post) throw new DemoError("HTTP_404", "Listing not found.");
    post.status = method === "DELETE" || ["BLOCKED", "INACTIVE", "DELETED"].includes(String(body.Status)) ? "DELETED" : body.Status === "SOLD" ? "SOLD" : "ACTIVE";
    audit(state, "Posts", Number(post.id), `Set ${post.status}`); return { success: true };
  }
  if (/^\/admin\/users\/\d+$/.test(path) && method === "GET") {
    const id = Number(path.split("/")[3]); const target = state.users.find(u => u.Id === id);
    if (!target) throw new DemoError("HTTP_404", "User not found.");
    return { user: target, recentPosts: state.posts.filter(p => p.sellerId === String(id)).map(adminPost), recentReviews: state.reviews.filter(r => r.ReviewedUserID === id) };
  }
  if (path === "/admin/users/bulk-status" && method === "PUT") {
    const ids = Array.isArray(body.userIds) ? body.userIds.map(Number) : [];
    if (!["active", "banned"].includes(String(body.status))) throw new DemoError("HTTP_400", "Invalid user status.");
    state.users.filter(u => ids.includes(u.Id) && u.Id !== user.Id).forEach(u => { u.Status = body.status === "active" ? 1 : 2; u.SuspendedUntil = undefined; audit(state, "Users", u.Id, "Status updated"); });
    return { success: true };
  }
  if (/^\/admin\/users\/\d+\/suspend$/.test(path) && method === "POST") {
    const target = state.users.find(u => u.Id === Number(path.split("/")[3]));
    if (!target) throw new DemoError("HTTP_404", "User not found.");
    if (target.Id === user.Id) throw new DemoError("HTTP_400", "Keep the active demo administrator available.");
    const hours = body.DurationHours === null ? null : Number(body.DurationHours);
    if (hours !== null && (!Number.isFinite(hours) || hours <= 0 || hours > 8760)) throw new DemoError("HTTP_400", "Invalid suspension duration.");
    target.Status = hours === null ? 2 : 1;
    target.SuspendedUntil = hours === null ? undefined : new Date(Date.now() + hours * 3600000).toISOString();
    audit(state, "Users", target.Id, "Suspended");
    return { Message: "Demo account suspended", SuspendedUntil: target.SuspendedUntil };
  }
  if (path === "/admin/reports" && method === "GET") {
    const reports = state.reports.filter(r => (!query.has("status") || r.status === Number(query.get("status"))) && (!query.get("reportType") || r.reportType === query.get("reportType")));
    const page = pageItems(reports, query); return { reports: page.items, totalCount: page.totalCount };
  }
  if (/^\/admin\/reports\/\d+\/status$/.test(path) && method === "PUT") {
    const report = state.reports.find(r => r.reportID === Number(path.split("/")[3]));
    if (!report) throw new DemoError("HTTP_404", "Report not found.");
    report.status = Number(body.Status); report.statusLabel = ["Pending", "Resolved", "Dismissed"][report.status] ?? "Resolved";
    report.resolutionNotes = String(body.ResolutionNotes ?? ""); report.resolvedByUserID = user.Id;
    report.resolvedByName = `${user.FirstName} ${user.LastName}`; report.resolvedAt = new Date().toISOString();
    audit(state, "Reports", report.reportID, report.statusLabel); return { success: true };
  }
  if (path === "/admin/reviews" && method === "GET") {
    const page = pageItems(state.reviews, query);
    return { totalCount: page.totalCount, reviews: page.items.map(r => ({ reviewID: r.ReviewID, reviewerID: r.ReviewerID,
      reviewerName: r.ReviewerName, reviewedUserID: r.ReviewedUserID,
      reviewedUserName: state.users.find(u => u.Id === r.ReviewedUserID)?.FirstName ?? "Seller", rating: r.Rating, comment: r.Comment, createdAt: r.Timestamp })) };
  }
  if (/^\/admin\/reviews\/\d+$/.test(path) && method === "DELETE") {
    const id = Number(path.split("/")[3]); state.reviews = state.reviews.filter(r => r.ReviewID !== id);
    audit(state, "Reviews", id, "Deleted"); return { success: true };
  }
  if (path === "/admin/post-comments" && method === "GET") {
    const page = pageItems(state.comments, query);
    return { totalCount: page.totalCount, comments: page.items.map(c => ({ commentID: c.commentId, postID: c.postId,
      postTitle: state.posts.find(p => p.id === String(c.postId))?.name, userID: c.userId, authorName: c.authorName,
      parentCommentID: c.parentCommentId, replyCount: c.replyCount, content: c.content, createdAt: c.createdAt, updatedAt: c.updatedAt })) };
  }
  if (/^\/admin\/post-comments\/\d+$/.test(path) && method === "DELETE") {
    const id = Number(path.split("/")[3]); state.comments = state.comments.filter(c => c.commentId !== id && c.parentCommentId !== id);
    audit(state, "Comments", id, "Deleted"); return { success: true };
  }
  if (path === "/admin/audit-logs" && method === "GET") {
    const page = pageItems(state.audit, query); return { entries: page.items, totalCount: page.totalCount };
  }
  if (path === "/admin/settings" && method === "GET") return [{ settingID: 1, settingKey: "DemoMode", label: "Portfolio demo", value: "true", valueType: "boolean", description: "Settings are read-only in the demo.", updatedAt: new Date().toISOString() }];
  if (path === "/admin/locations/cities" && method === "GET") return cities.map(c => ({ cityID: c.CityId, cityName: c.CityName, cityNameAr: c.CityNameAr,
    areas: areas.filter(a => a.CityId === c.CityId).map(a => ({ areaID: a.AreaId, cityID: a.CityId, areaName: a.AreaName, areaNameAr: a.AreaNameAr })) }));
  if (path === "/admin/permissions" && method === "GET") return [];
  if (/^\/admin\/permissions\/role\/\d+$/.test(path) && method === "GET") return [];
  if (path === "/admin/banners" && method === "GET") return { success: true, banners: [] };
  return undefined;
}

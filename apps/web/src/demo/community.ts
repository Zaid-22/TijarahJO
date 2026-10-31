import type { DemoRequest } from "./types";
import { DemoError, requireOwner, requireUser } from "./store";
import { pageItems } from "./marketplace";

export function community({ state, path, method, body, query }: DemoRequest): unknown {
  if (path.startsWith("/favorites")) {
    const user = requireUser(state); const key = String(user.Id);
    state.favorites[key] ??= [];
    if (path === "/favorites" && method === "GET") return { success: true, favorites: state.favorites[key] };
    const postId = String(body.postId ?? path.split("/")[2]);
    if (method === "POST" && path === "/favorites") {
      if (!state.posts.some(p => p.id === postId && p.status !== "DELETED")) throw new DemoError("HTTP_404", "Listing not found.");
      state.favorites[key] = [...new Set([...state.favorites[key], postId])]; return { success: true };
    }
    if (method === "DELETE" && /^\/favorites\/\d+$/.test(path)) {
      state.favorites[key] = state.favorites[key].filter(id => id !== postId); return { success: true };
    }
  }
  if (path === "/reviews/ratings" && method === "GET") return Object.fromEntries((query.get("userIds") ?? "").split(",").map(id => {
    const reviews = state.reviews.filter(r => r.ReviewedUserID === Number(id));
    return [id, { AverageRating: reviews.length ? reviews.reduce((sum, r) => sum + r.Rating, 0) / reviews.length : 0, ReviewCount: reviews.length }];
  }));
  if (/^\/reviews\/user\/\d+$/.test(path) && method === "GET") return state.reviews.filter(r => r.ReviewedUserID === Number(path.split("/")[3]));
  if (path === "/reviews" && method === "POST") {
    const user = requireUser(state); const target = Number(body.ReviewedUserID);
    if (target === user.Id || !state.users.some(u => u.Id === target)) throw new DemoError("HTTP_400", "Choose another seller to review.");
    const review = { ReviewID: state.nextId++, ReviewerID: user.Id, ReviewerName: `${user.FirstName} ${user.LastName}`,
      ReviewedUserID: target, Rating: Math.min(5, Math.max(1, Number(body.Rating) || 1)), Comment: String(body.Comment ?? ""), Timestamp: new Date().toISOString() };
    state.reviews.push(review); return review;
  }
  const comments = path.match(/^\/posts\/(\d+)\/comments(?:\/(\d+)(?:\/(replies))?)?$/);
  if (comments) {
    const postId = Number(comments[1]); const commentId = Number(comments[2]);
    if (method === "GET") {
      const list = state.comments.filter(c => c.postId === postId && (comments[3] ? c.parentCommentId === commentId : !c.parentCommentId));
      const page = pageItems(list, query);
      return { comments: page.items, totalCount: page.totalCount, page: page.pagination.currentPage, pageSize: page.pagination.postsPerPage };
    }
    const user = requireUser(state);
    if (method === "POST" && !comments[2]) {
      const id = state.nextId++;
      const comment = { id: String(id), commentId: id, postId, userId: user.Id,
        parentCommentId: Number(body.ParentCommentId) || null, content: String(body.Content ?? ""),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), authorName: `${user.FirstName} ${user.LastName}`,
        replyCount: 0, isEdited: false };
      if (!comment.content.trim()) throw new DemoError("HTTP_400", "Write a comment first.");
      state.comments.push(comment);
      const parent = state.comments.find(c => c.commentId === comment.parentCommentId);
      if (parent) parent.replyCount++;
      return comment;
    }
    const comment = state.comments.find(c => c.commentId === commentId && c.postId === postId);
    if (!comment) throw new DemoError("HTTP_404", "Comment not found.");
    requireOwner(state, comment.userId);
    if (method === "PUT") { comment.content = String(body.Content ?? ""); comment.isEdited = true; return comment; }
    if (method === "DELETE") { state.comments = state.comments.filter(c => c.commentId !== commentId && c.parentCommentId !== commentId); return { message: "Deleted" }; }
  }
  if (path.startsWith("/notifications")) {
    const user = requireUser(state); const items = state.notifications.filter(n => n.ownerId === user.Id);
    if (path === "/notifications" && method === "GET") return items.filter(n => query.get("unreadOnly") !== "true" || !n.isRead).slice(0, Math.max(1, Number(query.get("take")) || 50));
    if (path === "/notifications/unread-count" && method === "GET") return { UnreadCount: items.filter(n => !n.isRead).length };
    if (method === "PUT" && (path === "/notifications/read-all" || /^\/notifications\/\d+\/read$/.test(path))) {
      let count = 0;
      items.filter(n => path.endsWith("read-all") || n.notificationId === Number(path.split("/")[2])).forEach(n => {
        if (!n.isRead) count++; n.isRead = true; n.readAt = new Date().toISOString();
      });
      return { success: true, UpdatedCount: count };
    }
  }
  return undefined;
}

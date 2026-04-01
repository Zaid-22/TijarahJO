import type { PostComment } from "../../../types";
import {
  asRecord,
  readString,
  toBoolean,
  toIntegerOrDefault,
} from "../normalizers";
import { toIsoStringOrNow } from "../shared";

export type RawPostComment = {
  CommentID?: unknown;
  commentId?: unknown;
  commentID?: unknown;
  Id?: unknown;
  id?: unknown;
  PostID?: unknown;
  postId?: unknown;
  postID?: unknown;
  UserID?: unknown;
  userId?: unknown;
  userID?: unknown;
  ParentCommentID?: unknown;
  parentCommentId?: unknown;
  parentCommentID?: unknown;
  Content?: unknown;
  content?: unknown;
  CreatedAt?: unknown;
  createdAt?: unknown;
  UpdatedAt?: unknown;
  updatedAt?: unknown;
  AuthorName?: unknown;
  authorName?: unknown;
  AuthorAvatar?: unknown;
  authorAvatar?: unknown;
  ReplyCount?: unknown;
  replyCount?: unknown;
  IsEdited?: unknown;
  isEdited?: unknown;
};

type RawCommentListResponse = {
  Comments?: unknown;
  comments?: unknown;
  TotalCount?: unknown;
  totalCount?: unknown;
  Page?: unknown;
  page?: unknown;
  PageSize?: unknown;
  pageSize?: unknown;
};

export function parsePostComment(value: unknown): PostComment | null {
  const record = asRecord(value) as RawPostComment | null;
  if (!record) {
    return null;
  }

  const commentId = toIntegerOrDefault(
    record.commentId ?? record.commentID ?? record.CommentID,
    0,
    1,
  );
  const postId = toIntegerOrDefault(
    record.postId ?? record.postID ?? record.PostID,
    0,
    1,
  );
  const userId = toIntegerOrDefault(
    record.userId ?? record.userID ?? record.UserID,
    0,
    1,
  );

  if (!commentId || !postId || !userId) {
    return null;
  }

  const parentCommentId = toIntegerOrDefault(
    record.parentCommentId ?? record.parentCommentID ?? record.ParentCommentID,
    0,
    1,
  );
  const id = readString(record.id ?? record.Id) || String(commentId);

  return {
    commentId,
    id,
    postId,
    userId,
    parentCommentId: parentCommentId || null,
    content: readString(record.content ?? record.Content),
    createdAt: toIsoStringOrNow(record.createdAt ?? record.CreatedAt),
    updatedAt: toIsoStringOrNow(record.updatedAt ?? record.UpdatedAt),
    authorName:
      readString(record.authorName ?? record.AuthorName) || "Unknown User",
    authorAvatar:
      readString(record.authorAvatar ?? record.AuthorAvatar) || undefined,
    replyCount: toIntegerOrDefault(
      record.replyCount ?? record.ReplyCount,
      0,
      0,
    ),
    isEdited: toBoolean(record.isEdited ?? record.IsEdited, false),
  };
}

export function parsePostCommentsCollection(value: unknown): PostComment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => parsePostComment(entry))
    .filter((entry): entry is PostComment => entry !== null);
}

export function parseCommentListResponse(value: unknown): {
  comments: PostComment[];
  totalCount: number;
  page: number;
  pageSize: number;
} | null {
  const record = asRecord(value) as RawCommentListResponse | null;
  if (!record) {
    return null;
  }

  const comments = parsePostCommentsCollection(
    record.comments ?? record.Comments,
  );

  return {
    comments,
    totalCount: toIntegerOrDefault(
      record.totalCount ?? record.TotalCount,
      comments.length,
      0,
    ),
    page: toIntegerOrDefault(record.page ?? record.Page, 1, 1),
    pageSize: toIntegerOrDefault(
      record.pageSize ?? record.PageSize,
      comments.length || 20,
      1,
    ),
  };
}

import type { Post, Message, AppNotification, PostComment } from "../types";
import type { AdminReportItem, AdminAuditLogItem } from "../services/api/admin.types";

export interface DemoUser {
  Id: number;
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  City: string;
  Area: string;
  CityId: number;
  AreaId: number;
  Bio: string;
  Avatar: string;
  JoinedDate: string;
  RoleID: number;
  RoleName: string;
  HasAdminAccess: boolean;
  Status: number;
  SuspendedUntil?: string;
  IsDeleted: boolean;
}
export interface DemoReview {
  ReviewID: number;
  ReviewerID: number;
  ReviewerName: string;
  ReviewedUserID: number;
  Rating: number;
  Comment: string;
  Timestamp: string;
}
export interface DemoState {
  version: 1;
  nextId: number;
  session: number | null;
  users: DemoUser[];
  posts: Post[];
  favorites: Record<string, string[]>;
  messages: Message[];
  notifications: (AppNotification & { ownerId: number })[];
  reviews: DemoReview[];
  comments: PostComment[];
  reports: AdminReportItem[];
  audit: AdminAuditLogItem[];
}
export interface DemoRequest {
  state: DemoState;
  path: string;
  method: string;
  query: URLSearchParams;
  body: Record<string, unknown>;
  form?: FormData;
}

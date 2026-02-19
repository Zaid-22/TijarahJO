/* eslint-disable */
/* AUTO-GENERATED CONTRACT SNAPSHOT. Regenerate via scripts/contracts/generate_web_types.sh */

export interface AuthLoginRequest {
  login: string;
  password: string;
}

export interface AuthRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: number;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface PostFeedItem {
  postID: number;
  userID: number;
  categoryID: number;
  postTitle: string;
  postDescription: string;
  price?: number | null;
  city?: string | null;
  area?: string | null;
  status: 0 | 1 | 2 | 3;
  isDeleted: boolean;
  createdAt: string;
  views?: number;
  imageURLs?: string[];
}

export interface PostFeedResponse {
  success: boolean;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  posts: PostFeedItem[];
}

export interface UserResponse {
  userID: number;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  joinDate: string;
  roleID: number;
  status: number;
  isDeleted: boolean;
}

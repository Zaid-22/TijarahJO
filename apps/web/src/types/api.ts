/**
 * API Types and Interfaces for TijarahJo Backend Integration
 *
 * This file defines the API structure for backend communication.
 * All entities use string-based IDs for consistency.
 */

import { Post } from "../types";

export type PostImageInput = string | File;

// ============================================================================
// Authentication & User Management
// ============================================================================

export interface LoginRequest {
  email: string; // email or phone login identifier
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string; // can be empty when signing up with phone only
  password: string;
  phone: string; // Required; normalized to +962 format
  city: string;
  area: string;
  bio?: string;
  avatar?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // +962 format
  city: string;
  area?: string;
  bio?: string;
  avatar?: string;
  joinedDate: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
// ============================================================================
// Post/Post Management
// ============================================================================

export interface CreatePostRequest {
  title: string;
  price: number; // Minimum 0.01 JOD
  category: string;
  city: string;
  area?: string;
  description: string;
  images: PostImageInput[]; // Array of persisted URLs and/or raw File objects
  phone: string; // +962 format
  location?: string; // Legacy support
}

export interface UpdatePostRequest {
  id: string;
  title?: string;
  price?: number; // Minimum 0.01 JOD
  category?: string;
  status?: "ACTIVE" | "SOLD" | "DELETED" | "BLOCKED" | "INACTIVE";
  city?: string;
  area?: string;
  description?: string;
  images?: PostImageInput[];
  phone?: string;
  location?: string; // Legacy support
}

export interface UpdatePostStatusRequest {
  id: string;
  status: "ACTIVE" | "SOLD" | "DELETED" | "BLOCKED" | "INACTIVE";
}

export interface PostResponse {
  success: boolean;
  post?: Post;
  message?: string;
}

export interface PostsListResponse {
  success: boolean;
  posts: Post[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    postsPerPage: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// Category Management
// ============================================================================

export interface Category {
  id: string;
  name: string;
  nameAr: string; // Arabic translation
  icon: string; // Icon identifier
  color: string; // Hex color
  image: string; // Category image URL
  postCount: number;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

// ============================================================================
// Search & Filter
// ============================================================================

export interface SearchRequest {
  query?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: "ACTIVE" | "SOLD" | "DELETED";
  sortBy?: "date" | "price" | "views";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ============================================================================
// Seller Profile
// ============================================================================

export interface SellerProfile {
  id: string;
  name: string;
  phone: string;
  city: string;
  area?: string;
  bio?: string;
  avatar?: string;
  joinedDate: string;
  activeListingsCount: number;
  totalSalesCount: number;
}

export interface SellerProfileResponse {
  success: boolean;
  seller: SellerProfile;
  posts: Post[];
}

// ============================================================================
// API Endpoints Structure
// ============================================================================

/**
 * Backend API Endpoints (current controllers):
 *
 * AUTH:
 * - POST   /api/auth/signup
 * - POST   /api/auth/login
 * - POST   /api/auth/logout
 * - GET    /api/auth/me (get current user)
 *
 * POSTS:
 * - GET    /api/posts/feed?page=&limit=&includeDeleted= (canonical listing endpoint)
 * - GET    /api/posts/:id (get single post)
 * - POST   /api/posts (create new post)
 * - PUT    /api/posts/:id (update post)
 * - PATCH  /api/posts/:id/status (update post status)
 * - POST   /api/posts/:id/views (increment views)
 * - DELETE /api/posts/:id (delete post)
 * - GET    /api/posts/user/:userId (get user's posts)
 * - GET    /api/posts/category/:category (get posts by category)
 * - GET    /api/posts/Exists/:id
 * - Legacy /api/posts/All and /api/posts/pagination routes are removed
 *
 * CATEGORIES:
 * - GET    /api/categories
 * - GET    /api/categories/:id (get single category)
 * - POST   /api/categories
 * - PUT    /api/categories/:id
 * - DELETE /api/categories/:id
 * - GET    /api/categories/Exists/:id
 *
 * USERS:
 * - GET    /api/users
 * - GET    /api/users/:id (get user profile)
 * - POST   /api/users
 * - PUT    /api/users/:id (update user profile)
 * - DELETE /api/users/:id
 * - GET    /api/users/Exists/:id
 *
 * POST IMAGES:
 * - GET    /api/post-images
 * - GET    /api/post-images/:id
 * - POST   /api/post-images
 * - POST   /api/post-images/upload (multipart file upload)
 * - PUT    /api/post-images/:id
 * - DELETE /api/post-images/:id
 * - GET    /api/post-images/Exists/:id
 * - No legacy post-image route aliases are supported
 *
 * ROLES:
 * - GET    /api/roles
 * - GET    /api/roles/:id
 * - POST   /api/roles
 * - PUT    /api/roles/:id
 * - DELETE /api/roles/:id
 * - GET    /api/roles/Exists/:id
 *
 * REVIEWS:
 * - GET    /api/v1/reviews/user/:userId
 * - POST   /api/v1/reviews
 *
 * CHAT:
 * - GET    /api/v1/chat/recent
 * - GET    /api/v1/chat/history/:otherUserId
 * - GET    /api/v1/chat/presence/:otherUserId
 * - POST   /api/v1/chat/send
 * - POST   /api/v1/chat/upload-image
 *
 * FAVORITES:
 * - GET    /api/v1/favorites
 * - POST   /api/v1/favorites
 * - DELETE /api/v1/favorites/:postId
 *
 * SELLERS:
 * - GET    /api/sellers/:sellerId
 * - GET    /api/sellers/top
 *
 * SEARCH:
 * - GET    /api/search?query=&category=&city=&minPrice=&maxPrice=&status=&sortBy=&sortOrder=&page=&limit=
 */

// ============================================================================
// Error Responses
// ============================================================================

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================================================
// Common Response Wrapper
// ============================================================================

export type ApiResponse<T> = { success: true; data: T } | ApiError;

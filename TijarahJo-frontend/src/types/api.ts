/**
 * API Types and Interfaces for TijarahJo Backend Integration
 *
 * This file defines the API structure for backend communication.
 * All entities use string-based IDs for consistency.
 */

import { Product } from "../types";

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
  phone?: string; // Optional; normalized to +962 when provided
  city: string;
  area?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
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
// Product/Post Management
// ============================================================================

export interface CreatePostRequest {
  title: string;
  price: number; // Minimum 0.01 JOD
  category: string;
  city: string;
  area?: string;
  description: string;
  images: string[]; // Array of image URLs or base64
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
  images?: string[];
  phone?: string;
  location?: string; // Legacy support
}

export interface PostResponse {
  success: boolean;
  post?: Product;
  message?: string;
}

export interface PostsListResponse {
  success: boolean;
  posts: Product[];
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

export interface UpdatePostStatusRequest {
  id: string;
  status: "ACTIVE" | "SOLD" | "DELETED";
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
// Favorites Management
// ============================================================================

export interface AddFavoriteRequest {
  userId: string;
  postId: string;
}

export interface RemoveFavoriteRequest {
  userId: string;
  postId: string;
}

export interface FavoritesResponse {
  success: boolean;
  favorites: string[]; // Array of post IDs
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
  posts: Product[];
}

// ============================================================================
// Analytics & Statistics
// ============================================================================

export interface PostAnalytics {
  postId: string;
  views: number;
  favorites: number;
  createdAt: string;
  lastViewedAt?: string;
}

export interface UserAnalytics {
  userId: string;
  totalPosts: number;
  activePosts: number;
  soldPosts: number;
  totalViews: number;
  totalFavorites: number;
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
 * - GET    /api/posts/All
 * - GET    /api/posts/pagination?pageNumber=&rowsPerPage=&includeDeleted=
 * - GET    /api/posts/:id (get single post)
 * - POST   /api/posts (create new post)
 * - PUT    /api/posts/:id (update post)
 * - PATCH  /api/posts/:id/status (update post status)
 * - POST   /api/posts/:id/views (increment views)
 * - DELETE /api/posts/:id (delete post)
 * - GET    /api/posts/user/:userId (get user's posts)
 * - GET    /api/posts/category/:category (get posts by category)
 * - GET    /api/posts/Exists/:id
 *
 * CATEGORIES:
 * - GET    /api/categories/All
 * - GET    /api/categories/:id (get single category)
 * - POST   /api/categories
 * - PUT    /api/categories/:id
 * - DELETE /api/categories/:id
 * - GET    /api/categories/Exists/:id
 *
 * USERS:
 * - GET    /api/users/All
 * - GET    /api/users/:id (get user profile)
 * - POST   /api/users
 * - PUT    /api/users/:id (update user profile)
 * - DELETE /api/users/:id
 * - GET    /api/users/Exists/:id
 *
 * POST IMAGES:
 * - GET    /api/TbPostImages/All
 * - GET    /api/TbPostImages/:id
 * - POST   /api/TbPostImages
 * - PUT    /api/TbPostImages/:id
 * - DELETE /api/TbPostImages/:id
 * - GET    /api/TbPostImages/Exists/:id
 *
 * ROLES:
 * - GET    /api/TbRoles/All
 * - GET    /api/TbRoles/:id
 * - POST   /api/TbRoles
 * - PUT    /api/TbRoles/:id
 * - DELETE /api/TbRoles/:id
 * - GET    /api/TbRoles/Exists/:id
 *
 * REVIEWS:
 * - GET    /api/reviews/user/:userId
 * - POST   /api/reviews
 *
 * CHAT:
 * - GET    /api/chat/recent
 * - GET    /api/chat/history/:otherUserId
 * - POST   /api/chat/send
 *
 * FAVORITES:
 * - GET    /api/favorites
 * - POST   /api/favorites
 * - DELETE /api/favorites/:postId
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
    details?: any;
  };
}

// ============================================================================
// Common Response Wrapper
// ============================================================================

export type ApiResponse<T> = { success: true; data: T } | ApiError;

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
  usernameOrEmail: string; // Can be either username or email
  password: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string; // Must start with +962
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
  username: string;
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
}

export interface UpdatePostRequest {
  id: string;
  title?: string;
  price?: number; // Minimum 0.01 JOD
  category?: string;
  city?: string;
  area?: string;
  description?: string;
  images?: string[];
  phone?: string;
}

export interface PostResponse {
  success: boolean;
  post?: Product;
  message?: string;
}

export interface PostsListResponse {
  success: boolean;
  posts: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    postsPerPage: number;
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
  username: string;
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
 * Expected API Endpoints:
 * 
 * AUTH:
 * - POST   /api/auth/signup
 * - POST   /api/auth/login
 * - POST   /api/auth/logout
 * - GET    /api/auth/me (get current user)
 * 
 * POSTS:
 * - GET    /api/posts (list all posts with filters)
 * - GET    /api/posts/:id (get single post)
 * - POST   /api/posts (create new post)
 * - PUT    /api/posts/:id (update post)
 * - PATCH  /api/posts/:id/status (update post status)
 * - DELETE /api/posts/:id (delete post)
 * - GET    /api/posts/user/:userId (get user's posts)
 * - GET    /api/posts/category/:category (get posts by category)
 * 
 * CATEGORIES:
 * - GET    /api/categories (list all categories)
 * - GET    /api/categories/:id (get single category)
 * 
 * FAVORITES:
 * - GET    /api/favorites (get user's favorites)
 * - POST   /api/favorites (add to favorites)
 * - DELETE /api/favorites/:postId (remove from favorites)
 * 
 * USERS/SELLERS:
 * - GET    /api/users/:id (get user profile)
 * - PUT    /api/users/:id (update user profile)
 * - GET    /api/sellers/:id (get seller profile with posts)
 * - GET    /api/sellers/top (get top sellers)
 * 
 * SEARCH:
 * - GET    /api/search (search posts with filters)
 * 
 * ANALYTICS:
 * - GET    /api/analytics/post/:id (get post analytics)
 * - GET    /api/analytics/user/:id (get user analytics)
 * - POST   /api/analytics/view/:postId (track post view)
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

export type ApiResponse<T> = 
  | { success: true; data: T }
  | ApiError;

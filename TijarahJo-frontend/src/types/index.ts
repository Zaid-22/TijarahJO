// Core data types for the application

export interface Product {
  id: string; // Changed from number to string for UUID support
  name: string;
  price: number;
  location: string;
  area?: string; // Area/neighborhood within the city
  locationId?: string; // Link to location entity
  seller: string;
  sellerId: string; // Link to user entity
  category: string;
  categoryId?: string; // Link to category entity
  image: string; // Primary image for backward compatibility
  images?: string[]; // Array of all images
  imageIds?: string[]; // Array of image entity IDs
  phone?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  condition?: string;
  status?: "ACTIVE" | "SOLD" | "DELETED"; // Listing status - defaults to ACTIVE
}

export interface UserProfile {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  area?: string;
  location: string;
  locationId?: string; // Link to location entity
  bio: string;
  avatar: string;
  joinedDate: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type Language = "en" | "ar";

export type ViewMode = "grid-4" | "grid-3" | "grid-2" | "list";

export type CategoryType =
  | "All"
  | "Electronics"
  | "Accessories"
  | "Fashion"
  | "Home & Garden"
  | "Vehicles"
  | "Furniture"
  | "Sports"
  | "Business";

// Additional entity types with unique IDs

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  image?: string;
  description?: string;
}

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ImageEntity {
  id: string;
  url: string;
  filename?: string;
  size?: number;
  uploadedAt: string;
  uploadedBy?: string; // User ID
  relatedTo?: string; // Post ID or User ID
  relationType?: "post" | "profile" | "other";
}

export interface Message {
  messageId?: number;
  senderId: number;
  receiverId: number;
  postId?: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// Core data types for the application

export interface Post {
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
  averageRating?: number;
  reviewCount?: number;
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
  roleName?: string;
  hasAdminAccess?: boolean;
  permissions?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export type Language = "en" | "ar";

export type ViewMode = "grid-4" | "grid-3" | "grid-2" | "list";

// Additional entity types with unique IDs

export interface Message {
  messageId?: number;
  senderId: number;
  receiverId: number;
  conversationId?: number;
  postId?: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatPresence {
  isOnline: boolean;
  lastSeenAtUtc?: string;
  statusText?: string;
}

export interface AppNotification {
  notificationId: number;
  notificationType: string;
  title: string;
  body: string;
  senderUserId?: number;
  conversationId?: number;
  messageId?: number;
  routeUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface PostComment {
  commentId: number;
  id: string; // String version of CommentID
  postId: number;
  userId: number;
  parentCommentId?: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorAvatar?: string;
  replyCount: number;
  isEdited: boolean;
}

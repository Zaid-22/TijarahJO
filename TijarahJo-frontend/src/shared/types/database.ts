/**
 * Database Types for TijarahJo
 * 
 * These types match the database ERD schema.
 * Frontend uses camelCase while database uses snake_case.
 * Conversion happens at the API layer.
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  firstName: string;          // DB: first_name
  middleName?: string;         // DB: middle_name (nullable)
  lastName: string;            // DB: last_name
  username: string;            // DB: username (unique)
  email: string;               // DB: email (unique)
  phone: string;               // DB: phone (required)
  password?: string;           // DB: password (hashed, not returned to frontend)
  bio?: string;                // DB: bio (nullable)
  avatar?: string;             // DB: avatar (nullable)
  isVerified: boolean;         // DB: is_verified (default: false)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// Computed fields for display (not in database)
export interface UserProfile extends User {
  name: string;                // Computed: firstName + middleName + lastName
  joinedDate: string;          // Computed from createdAt
  defaultAddress?: Address;    // Relationship: User has many Addresses
  location?: string;           // Computed from defaultAddress
}

// ============================================================================
// ADDRESS TYPES
// ============================================================================

export interface Address {
  id: string;
  userId: string;              // DB: user_id (FK -> users.id)
  city: string;                // DB: city
  area: string;                // DB: area
  street?: string;             // DB: street (nullable)
  building?: string;           // DB: building (nullable)
  floor?: string;              // DB: floor (nullable)
  apartmentNumber?: string;    // DB: apartment_number (nullable)
  landmark?: string;           // DB: landmark (nullable)
  isDefault: boolean;          // DB: is_default (default: false)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// For display purposes
export interface AddressDisplay extends Address {
  fullAddress: string;         // Computed: city, area, street, etc.
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;                // DB: name (unique)
  nameAr: string;              // DB: name_ar (Arabic name)
  description?: string;        // DB: description (nullable)
  icon?: string;               // DB: icon (nullable)
  image?: string;              // DB: image (nullable)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// ============================================================================
// PRODUCT/ITEM TYPES
// ============================================================================

export interface Product {
  id: string;
  sellerId: string;            // DB: seller_id (FK -> users.id)
  categoryId: string;          // DB: category_id (FK -> categories.id)
  name: string;                // DB: name
  description: string;         // DB: description
  price: number;               // DB: price (decimal)
  condition: 'new' | 'used' | 'like-new'; // DB: condition
  status: 'active' | 'sold' | 'inactive';  // DB: status (default: 'active')
  isNegotiable: boolean;       // DB: is_negotiable (default: false)
  views: number;               // DB: views (default: 0)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// Product with relationships and computed fields
export interface ProductDisplay extends Product {
  seller: User;                // Relationship: Product belongs to User
  category: Category;          // Relationship: Product belongs to Category
  images: ProductImage[];      // Relationship: Product has many ProductImages
  location: string;            // From seller's default address
  phone: string;               // From seller's phone
}

// For legacy compatibility with current frontend
export interface LegacyProduct {
  id: number;
  name: string;
  price: number;
  location: string;
  seller: string;
  category: string;
  image: string;
  phone?: string;
  sellerId?: string;
  description?: string;
  condition?: string;
}

// ============================================================================
// PRODUCT IMAGE TYPES
// ============================================================================

export interface ProductImage {
  id: string;
  productId: string;           // DB: product_id (FK -> products.id)
  imageUrl: string;            // DB: image_url
  isPrimary: boolean;          // DB: is_primary (default: false)
  order: number;               // DB: order (default: 0)
  createdAt: Date | string;    // DB: created_at
}

// ============================================================================
// CONVERSATION & MESSAGE TYPES
// ============================================================================

export interface Conversation {
  id: string;
  buyerId: string;             // DB: buyer_id (FK -> users.id)
  sellerId: string;            // DB: seller_id (FK -> users.id)
  productId: string;           // DB: product_id (FK -> products.id)
  lastMessageAt?: Date | string; // DB: last_message_at (nullable)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

export interface Message {
  id: string;
  conversationId: string;      // DB: conversation_id (FK -> conversations.id)
  senderId: string;            // DB: sender_id (FK -> users.id)
  content: string;             // DB: content
  isRead: boolean;             // DB: is_read (default: false)
  createdAt: Date | string;    // DB: created_at
}

// ============================================================================
// RATING & REVIEW TYPES
// ============================================================================

export interface Rating {
  id: string;
  raterId: string;             // DB: rater_id (FK -> users.id)
  ratedUserId: string;         // DB: rated_user_id (FK -> users.id)
  productId?: string;          // DB: product_id (FK -> products.id, nullable)
  rating: number;              // DB: rating (1-5)
  review?: string;             // DB: review (nullable)
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// ============================================================================
// FAVORITE TYPES
// ============================================================================

export interface Favorite {
  id: string;
  userId: string;              // DB: user_id (FK -> users.id)
  productId: string;           // DB: product_id (FK -> products.id)
  createdAt: Date | string;    // DB: created_at
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface Report {
  id: string;
  reporterId: string;          // DB: reporter_id (FK -> users.id)
  reportedUserId?: string;     // DB: reported_user_id (FK -> users.id, nullable)
  reportedProductId?: string;  // DB: reported_product_id (FK -> products.id, nullable)
  reason: string;              // DB: reason
  description?: string;        // DB: description (nullable)
  status: 'pending' | 'reviewed' | 'resolved'; // DB: status (default: 'pending')
  createdAt: Date | string;    // DB: created_at
  updatedAt: Date | string;    // DB: updated_at
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  area: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  condition: 'new' | 'used' | 'like-new';
  isNegotiable: boolean;
  images: File[] | string[]; // Files for upload or URLs
}

export interface CreateAddressRequest {
  city: string;
  area: string;
  street?: string;
  building?: string;
  floor?: string;
  apartmentNumber?: string;
  landmark?: string;
  isDefault?: boolean;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  search?: string;
  sellerId?: string;
  city?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ProductStatus = 'active' | 'sold' | 'inactive';
export type ProductCondition = 'new' | 'used' | 'like-new';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';
export type UserRole = 'user' | 'admin'; // If you have roles

// ============================================================================
// CONVERSION UTILITIES (for API layer)
// ============================================================================

/**
 * These functions convert between camelCase (frontend) and snake_case (database)
 * They should be used in your API service layer
 */

export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const convertKeysToSnakeCase = <T extends Record<string, any>>(obj: T): any => {
  const result: any = {};
  for (const key in obj) {
    result[toSnakeCase(key)] = obj[key];
  }
  return result;
};

export const convertKeysToCamelCase = <T extends Record<string, any>>(obj: T): any => {
  const result: any = {};
  for (const key in obj) {
    result[toCamelCase(key)] = obj[key];
  }
  return result;
};
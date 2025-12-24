/**
 * API Service Layer for TijarahJo
 *
 * This service provides a clean interface for all backend API calls.
 * Replace the mock data with actual API endpoints when backend is ready.
 */

import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  CreatePostRequest,
  UpdatePostRequest,
  UpdatePostStatusRequest,
  PostResponse,
  PostsListResponse,
  FavoritesResponse,
  SellerProfileResponse,
  ApiResponse,
  SearchRequest,
  CategoriesResponse,
} from "../types/api";
import { Product } from "../types";

// ============================================================================
// Configuration
// ============================================================================

// Vite uses import.meta.env instead of process.env
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5033/api";

// Mock mode - set to true for testing without backend
const MOCK_MODE = false;

// Mock test users for authentication
const MOCK_USERS = [
  {
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    username: "testuser",
    email: "test@test.com",
    password: "password123",
    phone: "+962791234567",
    city: "Amman",
    area: "Abdoun",
    bio: "Test user account",
    avatar: undefined,
    joinedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-2",
    firstName: "Demo",
    lastName: "Account",
    username: "demo",
    email: "demo@demo.com",
    password: "demo123",
    phone: "+962781234567",
    city: "Amman",
    area: "Jabal Amman",
    bio: "Demo account",
    avatar: undefined,
    joinedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem("tijarahjo_token");

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Check if response has content
    const text = await response.text();

    // If response is empty, return appropriate response
    if (!text || text.trim().length === 0) {
      if (response.ok) {
        return { success: true, data: null as any };
      } else {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || "An error occurred",
            details: null,
          },
        };
      }
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // If not JSON, return error
      return {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: `Invalid JSON response: ${text.substring(0, 100)}`,
          details: { rawResponse: text },
        },
      };
    }

    if (!response.ok) {
      // For BadRequest (400), the error details are in the response body
      // ASP.NET Core returns AuthResponse with Message property
      const errorMessage =
        data.message ||
        data.Message ||
        data.error?.message ||
        data.error?.Message ||
        response.statusText ||
        "An error occurred";

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
          details: data,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message:
              "Request timed out. Please check if the backend is running on http://localhost:5033",
          },
        };
      }
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("ERR_CONNECTION_REFUSED") ||
        error.message.includes("NetworkError")
      ) {
        return {
          success: false,
          error: {
            code: "CONNECTION_REFUSED",
            message:
              "Cannot connect to backend. Please make sure the backend is running on http://localhost:5033. Start it with: cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI && dotnet run",
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please check if the backend is running.",
      },
    };
  }
}

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Login user with username/email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // MOCK MODE - bypass backend and use test credentials
    if (MOCK_MODE) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { usernameOrEmail, password } = credentials;

      // Find matching user
      const user = MOCK_USERS.find(
        (u) =>
          (u.email === usernameOrEmail || u.username === usernameOrEmail) &&
          u.password === password
      );

      if (user) {
        const token = `mock_token_${user.id}_${Date.now()}`;
        localStorage.setItem("tijarahjo_token", token);

        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          token,
          user: {
            ...userWithoutPassword,
            name: `${user.firstName} ${user.lastName}`,
          } as any,
        };
      } else {
        return {
          success: false,
          message: "Invalid email/username or password",
        };
      }
    }

    // Real API call - map frontend format to backend format
    const response = await apiRequest<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        Login: credentials.usernameOrEmail, // Backend expects "Login" not "usernameOrEmail"
        Password: credentials.password,
      }),
    });

    // Debug logging
    console.log("Login API response:", JSON.stringify(response, null, 2));
    console.log("Response success:", response.success);
    if (response.success) {
      console.log("Response data:", JSON.stringify(response.data, null, 2));
      console.log("Response data type:", typeof response.data);
      console.log(
        "Response data keys:",
        response.data ? Object.keys(response.data) : "null"
      );
    } else {
      console.log("Response error:", response.error);
    }

    if (response.success && response.data) {
      // Map backend response to frontend format
      const backendResponse = response.data;
      console.log("Backend response structure:", {
        hasSuccess: "Success" in backendResponse,
        hasToken: "Token" in backendResponse,
        hasUser: "User" in backendResponse,
        Success: backendResponse.Success,
        Token: backendResponse.Token ? "exists" : "missing",
        User: backendResponse.User ? "exists" : "missing",
      });

      // Check if backend returned an error in the data (AuthResponse with Success: false)
      if (backendResponse.Success === false) {
        const errorMessage =
          backendResponse.Message || "Login failed. Please try again.";
        console.log("Backend returned error in data:", errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }

      if (backendResponse.Token) {
        localStorage.setItem("tijarahjo_token", backendResponse.Token);
        console.log("Token saved to localStorage");
      } else {
        console.warn("No Token in backend response!");
      }

      // Transform backend UserResponseDTO to frontend User format
      if (backendResponse.User) {
        const user = backendResponse.User;
        console.log("User object from backend:", JSON.stringify(user, null, 2));
        const transformedUser = {
          id: user.Id || user.id || "",
          firstName: user.FirstName || user.firstName || "",
          lastName: user.LastName || user.lastName || "",
          username: user.Username || user.username || "",
          email: user.Email || user.email || "",
          phone: user.Phone || user.phone || "",
          city: user.City || user.city || "",
          area: user.Area || user.area || "",
          bio: user.Bio || user.bio || "",
          avatar: user.Avatar || user.avatar || undefined,
          joinedDate: user.JoinedDate
            ? new Date(user.JoinedDate).toISOString()
            : user.joinedDate
            ? new Date(user.joinedDate).toISOString()
            : new Date().toISOString(),
          createdAt: user.JoinedDate
            ? new Date(user.JoinedDate).toISOString()
            : user.joinedDate
            ? new Date(user.joinedDate).toISOString()
            : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log("Transformed user:", transformedUser);
        return {
          success: true,
          token: backendResponse.Token,
          user: transformedUser,
        } as any; // User type doesn't have name, but we need it
      } else {
        console.warn("No User object in backend response, but Success is true");
        // Even if User is missing, if Success is true and Token exists, return success
        if (backendResponse.Success && backendResponse.Token) {
          console.log("Returning success with token but no user");
          return {
            success: true,
            token: backendResponse.Token,
            message: backendResponse.Message || "Login successful",
          } as any;
        }
      }

      console.log(
        "Returning response with Success:",
        backendResponse.Success,
        "Token:",
        backendResponse.Token ? "exists" : "missing"
      );
      return {
        success: backendResponse.Success || false,
        token: backendResponse.Token,
        message: backendResponse.Message,
      };
    }

    // If we get here, response.success is false or response.data is missing
    console.error(
      "Login failed - response.success:",
      response.success,
      "response:",
      response
    );

    // Extract error message from response
    let errorMessage = "Login failed. Please try again.";

    // When backend returns error, check multiple places for the error message
    if (!response.success) {
      // Check response.error.details (AuthResponse object from backend)
      if (response.error && response.error.details) {
        const details = response.error.details as any;
        if (details.Message) {
          errorMessage = details.Message;
          console.log(
            "Found error message in response.error.details.Message:",
            errorMessage
          );
        } else if (details.message) {
          errorMessage = details.message;
          console.log(
            "Found error message in response.error.details.message:",
            errorMessage
          );
        } else if (details.Success === false && details.Message) {
          errorMessage = details.Message;
          console.log("Found error in AuthResponse:", errorMessage);
        }
      }

      // If no message in details, use the error message from apiRequest
      if (
        errorMessage === "Login failed. Please try again." &&
        response.error &&
        response.error.message
      ) {
        errorMessage = response.error.message;
        console.log("Using response.error.message:", errorMessage);
      }

      // Connection errors
      if (response.error && response.error.code === "CONNECTION_REFUSED") {
        errorMessage =
          "Cannot connect to backend. Please make sure the backend is running on http://localhost:5033";
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  },

  /**
   * Sign up new user
   */
  signup: async (userData: SignUpRequest): Promise<AuthResponse> => {
    // MOCK MODE - simulate signup
    if (MOCK_MODE) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user exists
      const existingUser = MOCK_USERS.find(
        (u) => u.email === userData.email || u.username === userData.username
      );

      if (existingUser) {
        return {
          success: false,
          message: "User with this email or username already exists",
        };
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        ...userData,
        area: userData.area || "", // Ensure area is always a string
        bio: "",
        avatar: undefined,
        joinedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_USERS.push(newUser);

      const token = `mock_token_${newUser.id}_${Date.now()}`;
      localStorage.setItem("tijarahjo_token", token);

      const { password: _, ...userWithoutPassword } = newUser;
      return {
        success: true,
        token,
        user: {
          ...userWithoutPassword,
          name: `${newUser.firstName} ${newUser.lastName}`,
        } as any,
      };
    }

    // Real API call - map frontend format to backend format
    const response = await apiRequest<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        Username: userData.username,
        Email: userData.email,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName || "",
        Phone: userData.phone || null,
        City: userData.city || null,
        Area: userData.area || null,
      }),
    });

    // Debug logging
    console.log("Signup API response:", response);
    console.log("Response success:", response.success);
    if (response.success) {
      console.log("Response data:", response.data);
    } else {
      console.log("Response error:", response.error);
    }

    if (response.success && response.data) {
      // Map backend response to frontend format
      const backendResponse = response.data;

      // Check if backend returned an error in the data (AuthResponse with Success: false)
      // This can happen if backend returns 201 Created but with Success: false in body
      if (backendResponse.Success === false) {
        const errorMessage =
          backendResponse.Message || "Registration failed. Please try again.";
        console.log("Backend returned error in data:", errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: {
            code: "SIGNUP_FAILED",
            message: errorMessage,
          },
        } as any;
      }

      if (backendResponse.Token) {
        localStorage.setItem("tijarahjo_token", backendResponse.Token);
      }

      // Transform backend UserResponseDTO to frontend User format
      if (backendResponse.User) {
        const user = backendResponse.User;
        return {
          success: true,
          token: backendResponse.Token,
          user: {
            id: user.Id || "",
            firstName: user.FirstName || "",
            lastName: user.LastName || "",
            username: user.Username || "",
            email: user.Email || "",
            phone: user.Phone || "",
            city: user.City || "",
            area: user.Area || "",
            bio: user.Bio || "",
            avatar: user.Avatar || undefined,
            joinedDate: user.JoinedDate
              ? new Date(user.JoinedDate).toISOString()
              : new Date().toISOString(),
            createdAt: user.JoinedDate
              ? new Date(user.JoinedDate).toISOString()
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        } as any; // User type doesn't have name, but we need it
      }

      return {
        success: backendResponse.Success || false,
        token: backendResponse.Token,
        message: backendResponse.Message,
      };
    }

    // Extract error message from response
    let errorMessage = "Registration failed. Please try again.";

    // When backend returns error, check multiple places for the error message
    if (!response.success) {
      // Check response.error.details (AuthResponse object from backend)
      if (response.error && response.error.details) {
        const details = response.error.details as any;
        if (details.Message) {
          errorMessage = details.Message;
          console.log(
            "Found error message in response.error.details.Message:",
            errorMessage
          );
        } else if (details.message) {
          errorMessage = details.message;
          console.log(
            "Found error message in response.error.details.message:",
            errorMessage
          );
        } else if (details.Success === false && details.Message) {
          errorMessage = details.Message;
          console.log("Found error in AuthResponse:", errorMessage);
        }
      }

      // If no message in details, use the error message from apiRequest
      if (
        errorMessage === "Registration failed. Please try again." &&
        response.error &&
        response.error.message
      ) {
        const errorStr = response.error.message;
        console.log("Using response.error.message:", errorStr);

        // Check for unique constraint violations in the error message
        if (
          errorStr.includes("UNIQUE KEY constraint") ||
          errorStr.includes("UQ_TbUsers")
        ) {
          if (
            errorStr.includes("UQ_TbUsers_Username") ||
            errorStr.includes("Username")
          ) {
            errorMessage =
              "An account with this username already exists. Please choose a different username.";
          } else if (
            errorStr.includes("UQ_TbUsers_E") ||
            errorStr.includes("UQ_TbUsers_Email") ||
            errorStr.includes("Email")
          ) {
            errorMessage =
              "An account with this email address already exists. Please use a different email or try logging in.";
          } else {
            errorMessage =
              "An account with this information already exists. Please check your details and try again.";
          }
        } else {
          errorMessage = errorStr;
        }
      }
      // Connection errors
      if (response.error && response.error.code === "CONNECTION_REFUSED") {
        errorMessage =
          "Cannot connect to backend. Please make sure the backend is running on http://localhost:5033";
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: {
        code: "SIGNUP_FAILED",
        message: errorMessage,
      },
    } as any;
  },

  /**
   * Register new user (alias for signup, legacy compatibility)
   */
  register: async (
    email: string,
    password: string,
    name: string,
    username?: string,
    phone?: string,
    city?: string,
    area?: string
  ): Promise<any> => {
    // Split name into first and last name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

    const userData: any = {
      email: email.trim(),
      password: password,
      firstName: firstName,
      lastName: lastName,
      username: username || email.split("@")[0],
      phone: phone || "",
      city: city || "Amman",
      area: area || "",
    };

    // Use signup function
    const result = await authApi.signup(userData);

    if (result.success) {
      return { success: true, data: result };
    }

    return {
      success: false,
      error: result.message,
    };
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await apiRequest("/auth/logout", { method: "POST" });
    localStorage.removeItem("tijarahjo_token");
    localStorage.removeItem("tijarahjo_auth");
    localStorage.removeItem("tijarahjo_user");
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    return await apiRequest("/auth/me", { method: "GET" });
  },
};

// ============================================================================
// Helper Functions: Transform Backend Models to Frontend Types
// ============================================================================

/**
 * Helper function to fetch and cache categories and users for enriching posts
 */
let categoriesCache: Record<number, string> | null = null;
let usersCache: Record<number, string> | null = null;

async function enrichPostsWithCategoryAndSeller(posts: any[]): Promise<any[]> {
  // Fetch categories if not cached
  if (!categoriesCache) {
    const categoriesResponse = await apiRequest<any[]>(
      "/categories/All",
      {
        method: "GET",
      }
    );
    const allCategories = categoriesResponse.success
      ? categoriesResponse.data || []
      : [];
    categoriesCache = {};
    allCategories.forEach((cat: any) => {
      const catId = cat.CategoryID || cat.categoryID;
      const catName = cat.CategoryName || cat.categoryName;
      if (catId) categoriesCache![catId] = catName;
    });
  }

  // Fetch users if not cached
  if (!usersCache) {
    const usersResponse = await apiRequest<any[]>("/TbUsers/All", {
      method: "GET",
    });
    const allUsers = usersResponse.success ? usersResponse.data || [] : [];
    usersCache = {};
    allUsers.forEach((user: any) => {
      const userId = user.UserID || user.userID;
      const username = user.Username || user.username || "";
      const firstName = user.FirstName || user.firstName || "";
      const lastName = user.LastName || user.lastName || "";
      if (userId) {
        // Use username from database (matches what's shown in database table)
        // Fallback to full name if username not available
        usersCache![userId] =
          username ||
          (firstName && lastName
            ? `${firstName} ${lastName}`.trim()
            : "Unknown");
      }
    });
  }

  // Enrich posts with category and seller names
  return posts.map((post: any) => {
    const categoryId = post.CategoryID || post.categoryID;
    const userId = post.UserID || post.userID;

    return {
      ...post,
      Category: categoriesCache![categoryId] || "Unknown",
      Seller: usersCache![userId] || "Unknown",
    };
  });
}

/**
 * Transform backend PostModel to frontend Product type
 */
function transformPostModelToProduct(
  postModel: any,
  images: string[] = [],
  fallbackIndex?: number
): Product {
  // Debug: Log what we're transforming
  console.log("Transforming postModel:", postModel);
  console.log("PostTitle in transform:", postModel.PostTitle);
  console.log("PostDescription in transform:", postModel.PostDescription);

  // Get images for this post
  const postImages =
    images.length > 0
      ? images
      : postModel.Images || [postModel.PostImageURL || ""].filter(Boolean);

  // Ensure we always have a unique ID - use fallback index if needed
  const postId = postModel.PostID?.toString() || postModel.id;
  const uniqueId =
    postId ||
    (fallbackIndex !== undefined
      ? `post-${fallbackIndex}`
      : `post-${Date.now()}-${Math.random()}`);

  const name = postModel.PostTitle ?? postModel.name ?? "";
  const description = postModel.PostDescription ?? postModel.description ?? "";

  console.log("Final name:", name);
  console.log("Final description:", description);

  return {
    id: uniqueId,
    name: name,
    price: postModel.Price ?? postModel.price ?? 0,
    location: postModel.Location ?? "Jordan",
    area: postModel.Area ?? postModel.area,
    seller: postModel.Seller ?? postModel.seller ?? "Unknown",
    sellerId:
      postModel.UserID?.toString() ??
      postModel.UserId?.toString() ??
      postModel.sellerId ??
      "",
    category: postModel.Category ?? postModel.category ?? "Unknown",
    categoryId:
      postModel.CategoryID?.toString() ??
      postModel.CategoryId?.toString() ??
      postModel.categoryId ??
      "",
    image: postImages[0] ?? "",
    images: postImages,
    description: description,
    createdAt: postModel.CreatedAt
      ? new Date(postModel.CreatedAt).toISOString()
      : new Date().toISOString(),
    views: postModel.Views || postModel.views || 0,
    status:
      postModel.Status === 0
        ? "ACTIVE"
        : postModel.Status === 3
        ? "SOLD"
        : postModel.Status === 1
        ? "DELETED"
        : postModel.Status || "ACTIVE",
  };
}

/**
 * Transform backend CategoryModel to frontend Category type (from api.ts)
 */
function transformCategoryModelToCategory(
  categoryModel: any,
  fallbackIndex?: number
): import("../types/api").Category {
  const categoryId = categoryModel.CategoryID?.toString() || categoryModel.id;
  const uniqueId =
    categoryId ||
    (fallbackIndex !== undefined
      ? `category-${fallbackIndex}`
      : `category-${Date.now()}-${Math.random()}`);

  return {
    id: uniqueId,
    name: categoryModel.CategoryName || categoryModel.name || "",
    nameAr: categoryModel.CategoryName || categoryModel.name || "", // Use same as name for now
    icon: categoryModel.Icon || categoryModel.icon || "",
    color: categoryModel.Color || categoryModel.color || "#0A4ABF",
    image: categoryModel.Image || categoryModel.image || "",
    postCount: 0, // Will be calculated separately if needed
  };
}

// ============================================================================
// Posts/Products API
// ============================================================================

export const postsApi = {
  /**
   * Get all posts with optional filters and pagination
   */
  getPosts: async (params?: SearchRequest): Promise<PostsListResponse> => {
    // Use pagination endpoint if page/limit provided, otherwise use All
    if (params?.page || params?.limit) {
      const pageNumber = params.page || 1;
      const rowsPerPage = params.limit || 20;

      const response = await apiRequest<any[]>(
        `/posts/pagination?PageNumber=${pageNumber}&RowsPerPage=${rowsPerPage}&IncludeDeleted=false`,
        { method: "GET" }
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        // Get post images (even if posts array is empty)
        const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
          method: "GET",
        });
        const allImages = imagesResponse.success
          ? imagesResponse.data || []
          : [];

        console.log("getPosts (pagination) - Images response:", imagesResponse);
        console.log("getPosts (pagination) - All images:", allImages);

        // Group images by post ID
        const imagesByPostId: Record<string, string[]> = {};
        allImages.forEach((img: any) => {
          const postId = img.PostID?.toString() || "";
          if (!imagesByPostId[postId]) imagesByPostId[postId] = [];
          if (
            img.PostImageURL &&
            img.PostImageURL.trim() !== "" &&
            !img.IsDeleted
          ) {
            imagesByPostId[postId].push(img.PostImageURL);
            console.log(
              `getPosts (pagination) - Added image for PostID ${postId}: ${img.PostImageURL}`
            );
          }
        });

        console.log(
          "getPosts (pagination) - Images by PostID:",
          imagesByPostId
        );

        // Enrich posts with category and seller names
        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data
        );

        // Process posts (even if empty array)
        const posts = enrichedPosts.map((post: any) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || []
          )
        );

        return {
          success: true,
          posts,
          pagination: {
            currentPage: pageNumber,
            totalPages:
              response.data.length > 0
                ? Math.ceil(posts.length / rowsPerPage)
                : 0,
            totalPosts: posts.length,
            postsPerPage: rowsPerPage,
          },
        };
      }
    } else {
      // Get all posts
      const response = await apiRequest<any[]>("/posts/All", {
        method: "GET",
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // Debug: Log raw response
        console.log("getPosts - Raw response.data:", response.data);
        if (response.data.length > 0) {
          console.log("First post in response:", response.data[0]);
          console.log("First post PostTitle:", response.data[0].PostTitle);
          console.log(
            "First post PostDescription:",
            response.data[0].PostDescription
          );
        }

        // Get post images (even if posts array is empty)
        const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
          method: "GET",
        });
        const allImages = imagesResponse.success
          ? imagesResponse.data || []
          : [];

        // Group images by post ID
        const imagesByPostId: Record<string, string[]> = {};
        allImages.forEach((img: any) => {
          const postId = img.PostID?.toString() || "";
          if (!imagesByPostId[postId]) imagesByPostId[postId] = [];
          if (img.PostImageURL) imagesByPostId[postId].push(img.PostImageURL);
        });

        // Enrich posts with category and seller names
        const enrichedPosts = await enrichPostsWithCategoryAndSeller(
          response.data
        );

        console.log("Enriched posts:", enrichedPosts);
        if (enrichedPosts.length > 0) {
          console.log("First enriched post:", enrichedPosts[0]);
        }

        // Process posts (even if empty array)
        const posts = enrichedPosts.map((post: any, index: number) =>
          transformPostModelToProduct(
            post,
            imagesByPostId[post.PostID?.toString() || ""] || [],
            index
          )
        );

        console.log("Final transformed posts:", posts);
        if (posts.length > 0) {
          console.log("First transformed post name:", posts[0].name);
          console.log(
            "First transformed post description:",
            posts[0].description
          );
        }

        return {
          success: true,
          posts,
          pagination: {
            currentPage: 1,
            totalPages: response.data.length > 0 ? 1 : 0,
            totalPosts: posts.length,
            postsPerPage: posts.length > 0 ? posts.length : 20,
          },
        };
      }
    }

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: 20,
      },
    };
  },

  /**
   * Get single post by ID
   */
  getPost: async (id: string): Promise<Product | null> => {
    const response = await apiRequest<any>(`/posts/${id}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      // Debug: Log the raw response
      console.log("Raw API response for post:", response.data);
      console.log("PostTitle:", response.data.PostTitle);
      console.log("PostDescription:", response.data.PostDescription);

      // Get images for this post
      const imagesResponse = await apiRequest<any[]>(`/TbPostImages/All`, {
        method: "GET",
      });
      const allImages = imagesResponse.success ? imagesResponse.data || [] : [];
      console.log("getPost - Images response:", imagesResponse);
      console.log("getPost - All images:", allImages);
      console.log("getPost - Looking for PostID:", id);

      const postImages = allImages
        .filter((img: any) => img.PostID?.toString() === id && !img.IsDeleted)
        .map((img: any) => img.PostImageURL)
        .filter((url: string) => url && url.trim() !== "");

      console.log("getPost - Filtered images for this post:", postImages);

      const transformed = transformPostModelToProduct(
        response.data,
        postImages
      );
      console.log("Transformed product:", transformed);
      console.log("Product name:", transformed.name);
      console.log("Product description:", transformed.description);

      return transformed;
    }

    return null;
  },

  /**
   * Create new post
   */
  createPost: async (postData: CreatePostRequest): Promise<PostResponse> => {
    // Get current user ID from JWT token by calling /auth/me endpoint
    let userId = "";
    try {
      const currentUserResponse = await api.auth.getCurrentUser();
      if (currentUserResponse.success && currentUserResponse.data) {
        const user = currentUserResponse.data as any;
        userId = (user.Id || user.id || "").toString();
        console.log("[createPost] Got user ID from /auth/me:", userId);
      } else {
        console.warn("[createPost] Failed to get current user from /auth/me");
      }
    } catch (error) {
      console.error("[createPost] Error getting current user:", error);
    }

    // Try to decode JWT token as fallback
    if (!userId) {
      try {
        const token = localStorage.getItem("tijarahjo_token");
        if (token) {
          // JWT token format: header.payload.signature
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = (payload.nameid || payload.sub || "").toString();
          console.log("[createPost] Got user ID from JWT token:", userId);
        }
      } catch (tokenError) {
        console.error("[createPost] Error decoding token:", tokenError);
      }
    }

    // If still no user ID, throw error instead of defaulting to admin
    if (!userId || userId === "" || userId === "0") {
      const errorMsg =
        "Cannot create post: User not authenticated. Please log in first.";
      console.error("[createPost]", errorMsg);
      return {
        success: false,
        message: errorMsg,
        error: {
          code: "UNAUTHORIZED",
          message: errorMsg,
        },
      } as any;
    }

    // Find category ID by name
    const categoriesResponse = await apiRequest<any[]>(
      "/categories/All",
      { method: "GET" }
    );
    const categories = categoriesResponse.success
      ? categoriesResponse.data || []
      : [];
    const category = categories.find(
      (cat: any) =>
        cat.CategoryName?.toLowerCase() ===
        (postData.category || "").toLowerCase()
    );
    const categoryId =
      category?.CategoryID || parseInt(postData.category || "1") || 1;

    // Map frontend format to backend PostModel format
    const backendPost = {
      PostID: null,
      UserID: parseInt(userId),
      CategoryID: categoryId,
      PostTitle: postData.title,
      PostDescription: postData.description || "",
      Price: postData.price,
      Status: 0, // 0 = ACTIVE
      CreatedAt: new Date().toISOString(),
      IsDeleted: false,
    };

    const response = await apiRequest<any>("/posts", {
      method: "POST",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      const postId = response.data.PostID || response.data.postID;
      console.log("[createPost] Post created with ID:", postId);

      // Create post images
      const savedImageUrls: string[] = [];
      if (postData.images && postData.images.length > 0) {
        console.log(
          "[createPost] Creating",
          postData.images.length,
          "images for post",
          postId
        );
        const imagePromises = postData.images.map(async (imageUrl, index) => {
          if (!imageUrl || imageUrl.trim() === "") {
            console.warn(
              `[createPost] Skipping empty image URL at index ${index}`
            );
            return null;
          }

          try {
            const imageResponse = await apiRequest<any>("/TbPostImages", {
              method: "POST",
              body: JSON.stringify({
                PostID: postId,
                PostImageURL: imageUrl,
                UploadedAt: new Date().toISOString(),
                IsDeleted: false,
              }),
            });

            if (imageResponse.success && imageResponse.data) {
              console.log(
                `[createPost] Image ${index + 1} created successfully:`,
                imageResponse.data
              );
              savedImageUrls.push(imageUrl);
              return imageResponse.data;
            } else {
              const errorMsg =
                !imageResponse.success && "error" in imageResponse
                  ? imageResponse.error?.message || "Unknown error"
                  : "Unknown error";
              console.error(
                `[createPost] Failed to create image ${index + 1}:`,
                errorMsg
              );
              return null;
            }
          } catch (error) {
            console.error(
              `[createPost] Error creating image ${index + 1}:`,
              error
            );
            return null;
          }
        });

        const imageResults = await Promise.all(imagePromises);
        const successfulImages = imageResults.filter((img) => img !== null);
        console.log(
          `[createPost] Successfully created ${successfulImages.length} out of ${postData.images.length} images`
        );
      } else {
        console.log("[createPost] No images to create");
      }

      const product = transformPostModelToProduct(
        response.data,
        savedImageUrls.length > 0 ? savedImageUrls : postData.images || []
      );
      return {
        success: true,
        post: product,
      };
    }

    let errorMessage = "Failed to create post";
    if (!response.success) {
      if ("error" in response) {
        errorMessage = response.error?.message || "Failed to create post";
      }
    }
    return {
      success: false,
      message: errorMessage,
    };
  },

  /**
   * Update existing post
   */
  updatePost: async (postData: UpdatePostRequest): Promise<PostResponse> => {
    // Get current post to preserve fields
    const currentPostResponse = await apiRequest<any>(
      `/posts/${postData.id}`,
      { method: "GET" }
    );
    if (!currentPostResponse.success || !currentPostResponse.data) {
      return { success: false, message: "Post not found" };
    }

    const currentPost = currentPostResponse.data;

    // Find category ID if category name provided
    let categoryId = currentPost.CategoryID;
    if (postData.category) {
      const categoriesResponse = await apiRequest<any[]>(
        "/categories/All",
        { method: "GET" }
      );
      const categories = categoriesResponse.success
        ? categoriesResponse.data || []
        : [];
      const category = categories.find(
        (cat: any) =>
          cat.CategoryName?.toLowerCase() ===
          (postData.category || "").toLowerCase()
      );
      if (category) categoryId = category.CategoryID;
    }

    // Map frontend format to backend PostModel format
    const backendPost = {
      PostID: parseInt(postData.id),
      UserID: currentPost.UserID,
      CategoryID: categoryId,
      PostTitle: postData.title || currentPost.PostTitle,
      PostDescription: postData.description || currentPost.PostDescription,
      Price: postData.price !== undefined ? postData.price : currentPost.Price,
      Status: currentPost.Status,
      CreatedAt: currentPost.CreatedAt,
      IsDeleted: currentPost.IsDeleted,
    };

    const response = await apiRequest<any>(`/posts/${postData.id}`, {
      method: "PUT",
      body: JSON.stringify(backendPost),
    });

    if (response.success && response.data) {
      // Update images if provided
      if (postData.images) {
        // Delete old images
        const imagesResponse = await apiRequest<any[]>(`/TbPostImages/All`, {
          method: "GET",
        });
        const allImages = imagesResponse.success
          ? imagesResponse.data || []
          : [];
        const postImages = allImages.filter(
          (img: any) => img.PostID?.toString() === postData.id
        );

        for (const img of postImages) {
          await apiRequest(`/TbPostImages/${img.PostImageID}`, {
            method: "DELETE",
          });
        }

        // Add new images
        for (const imageUrl of postData.images) {
          await apiRequest("/TbPostImages", {
            method: "POST",
            body: JSON.stringify({
              PostID: parseInt(postData.id),
              PostImageURL: imageUrl,
              UploadedAt: new Date().toISOString(),
              IsDeleted: false,
            }),
          });
        }
      }

      const product = transformPostModelToProduct(
        response.data,
        postData.images || []
      );
      return {
        success: true,
        post: product,
      };
    }

    return {
      success: false,
      message: (response as any).error?.message || "Failed to update post",
    };
  },

  /**
   * Update post status (ACTIVE, SOLD, DELETED)
   */
  updatePostStatus: async (
    data: UpdatePostStatusRequest
  ): Promise<PostResponse> => {
    // Map frontend status to backend format
    const statusMap: Record<string, string> = {
      ACTIVE: "ACTIVE",
      SOLD: "SOLD",
      DELETED: "INACTIVE",
    };

    const response = await apiRequest<any>(`/posts/${data.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ Status: statusMap[data.status] || "ACTIVE" }),
    });

    if (response.success && response.data) {
      const product = transformPostModelToProduct(response.data);
      return {
        success: true,
        post: product,
      };
    }

    return {
      success: false,
      message:
        (response as any).error?.message || "Failed to update post status",
    };
  },

  /**
   * Delete post
   */
  deletePost: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiRequest<any>(`/posts/${id}`, {
      method: "DELETE",
    });

    return { success: response.success };
  },

  /**
   * Get posts by user ID
   */
  getUserPosts: async (userId: string): Promise<Product[]> => {
    const response = await apiRequest<any[]>(`/posts/user/${userId}`, {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      // Get post images
      const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
        method: "GET",
      });
      const allImages = imagesResponse.success ? imagesResponse.data || [] : [];

      // Group images by post ID
      const imagesByPostId: Record<string, string[]> = {};
      allImages.forEach((img: any) => {
        const postId = img.PostID?.toString() || "";
        if (!imagesByPostId[postId]) imagesByPostId[postId] = [];
        if (img.PostImageURL) imagesByPostId[postId].push(img.PostImageURL);
      });

      return response.data.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          imagesByPostId[post.PostID?.toString() || ""] || [],
          index
        )
      );
    }

    return [];
  },

  /**
   * Get posts by category
   */
  getPostsByCategory: async (
    category: string,
    page: number = 1
  ): Promise<PostsListResponse> => {
    // Find category ID by name or use as ID
    let categoryId = parseInt(category);
    if (isNaN(categoryId)) {
      const categoriesResponse = await apiRequest<any[]>(
        "/categories/All",
        { method: "GET" }
      );
      const categories = categoriesResponse.success
        ? categoriesResponse.data || []
        : [];
      const cat = categories.find(
        (c: any) => c.CategoryName?.toLowerCase() === category.toLowerCase()
      );
      if (cat) categoryId = cat.CategoryID;
      else
        return {
          success: false,
          posts: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalPosts: 0,
            postsPerPage: 20,
          },
        };
    }

    const response = await apiRequest<any[]>(
      `/posts/category/${categoryId}`,
      { method: "GET" }
    );

    if (response.success && response.data && Array.isArray(response.data)) {
      // Get post images
      const imagesResponse = await apiRequest<any[]>("/TbPostImages/All", {
        method: "GET",
      });
      const allImages = imagesResponse.success ? imagesResponse.data || [] : [];

      // Group images by post ID
      const imagesByPostId: Record<string, string[]> = {};
      allImages.forEach((img: any) => {
        const postId = img.PostID?.toString() || "";
        if (!imagesByPostId[postId]) imagesByPostId[postId] = [];
        if (img.PostImageURL) imagesByPostId[postId].push(img.PostImageURL);
      });

      const posts = response.data.map((post: any, index: number) =>
        transformPostModelToProduct(
          post,
          imagesByPostId[post.PostID?.toString() || ""] || [],
          index
        )
      );

      return {
        success: true,
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(posts.length / 20),
          totalPosts: posts.length,
          postsPerPage: 20,
        },
      };
    }

    return {
      success: false,
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        postsPerPage: 20,
      },
    };
  },

  /**
   * Track post view (analytics)
   */
  trackView: async (postId: string): Promise<void> => {
    await apiRequest(`/analytics/view/${postId}`, { method: "POST" });
  },
};

// ============================================================================
// Categories API
// ============================================================================

export const categoriesApi = {
  /**
   * Get all categories
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiRequest<any[]>("/categories/All", {
      method: "GET",
    });

    if (response.success && response.data && Array.isArray(response.data)) {
      const categories = response.data.map((cat: any, index: number) =>
        transformCategoryModelToCategory(cat, index)
      );
      return {
        success: true,
        categories,
      };
    }

    return { success: false, categories: [] };
  },
};

// ============================================================================
// Favorites API
// ============================================================================

export const favoritesApi = {
  /**
   * Get user's favorites
   */
  getFavorites: async (): Promise<string[]> => {
    const response = await apiRequest<FavoritesResponse>("/favorites", {
      method: "GET",
    });

    return response.success ? response.data.favorites : [];
  },

  /**
   * Add post to favorites
   */
  addFavorite: async (postId: string): Promise<boolean> => {
    const response = await apiRequest<{ success: boolean }>("/favorites", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });

    return response.success ? response.data.success : false;
  },

  /**
   * Remove post from favorites
   */
  removeFavorite: async (postId: string): Promise<boolean> => {
    const response = await apiRequest<{ success: boolean }>(
      `/favorites/${postId}`,
      {
        method: "DELETE",
      }
    );

    return response.success ? response.data.success : false;
  },
};

// ============================================================================
// Sellers API
// ============================================================================

export const sellersApi = {
  /**
   * Get seller profile with posts
   */
  getSellerProfile: async (
    sellerId: string
  ): Promise<SellerProfileResponse | null> => {
    const response = await apiRequest<SellerProfileResponse>(
      `/sellers/${sellerId}`,
      {
        method: "GET",
      }
    );

    return response.success ? response.data : null;
  },

  /**
   * Get top sellers
   */
  getTopSellers: async () => {
    const response = await apiRequest("/sellers/top", { method: "GET" });
    return response.success ? response.data : [];
  },
};

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
  /**
   * Get user profile by ID
   */
  getUser: async (userId: string) => {
    // Try /users/{id} first (returns full UserModel with HashedPassword)
    let response = await apiRequest<any>(`/users/${userId}`, {
      method: "GET",
    });

    // Fallback to /TbUsers/{userId} if /users/{id} fails
    if (!response.success) {
      response = await apiRequest<any>(`/TbUsers/${userId}`, {
        method: "GET",
      });
    }

    if (response.success && response.data) {
      const user = response.data;
      // Return the full user object including HashedPassword for updates
      return {
        UserID: user.UserID || user.userID || parseInt(userId),
        id: user.UserID?.toString() || user.id || userId,
        Username: user.Username || user.username || "",
        HashedPassword: user.HashedPassword || user.hashedPassword || "",
        Email: user.Email || user.email || "",
        FirstName: user.FirstName || user.firstName || "",
        LastName: user.LastName || user.lastName || "",
        JoinDate: user.JoinDate || user.joinDate || new Date().toISOString(),
        Status: user.Status || user.status || 1,
        RoleID: user.RoleID || user.roleID || 2,
        IsDeleted: user.IsDeleted || user.isDeleted || false,
        // Also include transformed fields for frontend use
        firstName: user.FirstName || user.firstName || "",
        lastName: user.LastName || user.lastName || "",
        username: user.Username || user.username || "",
        email: user.Email || user.email || "",
        phone: user.Phone || user.phone || "",
        city: user.City || user.city || "",
        area: user.Area || user.area || "",
        bio: user.Bio || user.bio || "",
        avatar: user.Avatar || user.avatar || undefined,
        joinedDate: user.JoinDate
          ? new Date(user.JoinDate).toISOString()
          : new Date().toISOString(),
        name: `${user.FirstName || user.firstName || ""} ${
          user.LastName || user.lastName || ""
        }`.trim(),
      };
    }

    return null;
  },

  /**
   * Update user profile
   */
  updateUser: async (userId: string, userData: any) => {
    console.log("[updateUser] Updating user:", userId, userData);
    console.log(
      "[updateUser] User data being sent:",
      JSON.stringify(userData, null, 2)
    );

    const response = await apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    console.log("[updateUser] Response:", response);
    console.log("[updateUser] Response success:", response.success);

    if (response.success) {
      // TypeScript knows response.data exists when success is true
      const data = (response as { success: true; data: any }).data;
      console.log("[updateUser] Response data:", data);
      console.log("[updateUser] Update successful");
      return data;
    } else {
      // TypeScript knows response.error exists when success is false
      const errorResponse = response as { success: false; error: any };
      const errorMessage =
        errorResponse.error?.message || "Failed to update user";
      console.error("[updateUser] Failed:", errorMessage);
      console.error("[updateUser] Full response:", response);
      throw new Error(errorMessage);
    }
  },
};

// ============================================================================
// Search API
// ============================================================================

export const searchApi = {
  /**
   * Search posts with filters
   */
  search: async (params: SearchRequest): Promise<PostsListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiRequest<PostsListResponse>(
      `/search?${queryParams.toString()}`,
      { method: "GET" }
    );

    return response.success
      ? response.data
      : {
          success: false,
          posts: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalPosts: 0,
            postsPerPage: 20,
          },
        };
  },
};

// ============================================================================
// Export all APIs
// ============================================================================

export const api = {
  auth: authApi,
  posts: postsApi,
  categories: categoriesApi,
  favorites: favoritesApi,
  sellers: sellersApi,
  users: usersApi,
  search: searchApi,
};

export default api;

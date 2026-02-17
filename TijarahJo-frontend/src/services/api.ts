/**
 * API Service Layer for TijarahJo
 *
 * Central export surface for domain API modules.
 */

import { authApi } from "./api/auth";
import { categoriesApi } from "./api/categories";
import { chatApi } from "./api/chat";
import { debugError } from "./api/client";
import { favoritesApi } from "./api/favorites";
import { postsApi } from "./api/posts";
import { reviewsApi } from "./api/reviews";
import { rolesApi } from "./api/roles";
import { searchApi } from "./api/search";
import { sellersApi } from "./api/sellers";
import { usersApi } from "./api/users";

export { authApi } from "./api/auth";
export { categoriesApi } from "./api/categories";
export { chatApi } from "./api/chat";
export { favoritesApi } from "./api/favorites";
export { postsApi, clearCaches } from "./api/posts";
export { reviewsApi } from "./api/reviews";
export { rolesApi } from "./api/roles";
export { searchApi } from "./api/search";
export { sellersApi } from "./api/sellers";
export { usersApi } from "./api/users";

export const api = {
  auth: authApi,
  posts: postsApi,
  categories: categoriesApi,
  roles: rolesApi,
  favorites: favoritesApi,
  sellers: sellersApi,
  users: usersApi,
  reviews: reviewsApi,
  chat: chatApi,
  search: searchApi,
  admin: {
    getStats: async () => {
      try {
        const [postsData, usersData] = await Promise.all([
          postsApi.getPosts(),
          usersApi.getAllUsers(),
        ]);

        const totalPosts = postsData.success ? postsData.posts.length : 0;
        const activeListings = postsData.success
          ? postsData.posts.filter((post) => post.status === "ACTIVE").length
          : 0;
        const totalUsers = usersData.success ? usersData.users.length : 0;

        return {
          totalUsers,
          totalPosts,
          activeListings,
          totalRevenue: 0,
        };
      } catch (error) {
        debugError("Failed to fetch admin stats:", error);
        return {
          totalUsers: 0,
          totalPosts: 0,
          activeListings: 0,
          totalRevenue: 0,
        };
      }
    },
  },
};

export default api;

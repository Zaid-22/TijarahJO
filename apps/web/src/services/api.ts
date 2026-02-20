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
        const [postsData, activePostsData, usersData] = await Promise.all([
          postsApi.getPosts({ page: 1, limit: 1 }),
          searchApi.search({ status: "ACTIVE", page: 1, limit: 1 }),
          usersApi.getAllUsers(),
        ]);

        const totalPosts = postsData.success
          ? (postsData.pagination?.totalPosts ?? postsData.posts.length)
          : 0;
        const activeListings = activePostsData.success
          ? (activePostsData.pagination?.totalPosts ??
            activePostsData.posts.length)
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
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch admin stats",
        );
      }
    },
  },
};

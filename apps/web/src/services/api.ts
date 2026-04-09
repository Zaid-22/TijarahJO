/**
 * API Service Layer for TijarahJo
 *
 * Central export surface for domain API modules.
 */

import { authApi } from "./api/auth";
import { categoriesApi } from "./api/categories";
import { chatApi } from "./api/chat";
import { compareApi } from "./api/compare";
import { favoritesApi } from "./api/favorites";
import { locationsApi } from "./api/locations";
import { notificationsApi } from "./api/notifications";
import { postsApi } from "./api/posts";
import { commentsApi } from "./api/comments";
import { reviewsApi } from "./api/reviews";
import { reportsApi } from "./api/reports";
import { rolesApi } from "./api/roles";
import { searchApi } from "./api/search";
import { sellersApi } from "./api/sellers";
import { systemApi } from "./api/system";
import { usersApi } from "./api/users";
import { adminApi } from "./api/admin";

export const api = {
  auth: authApi,
  posts: postsApi,
  categories: categoriesApi,
  compare: compareApi,
  roles: rolesApi,
  favorites: favoritesApi,
  sellers: sellersApi,
  users: usersApi,
  locations: locationsApi,
  comments: commentsApi,
  reviews: reviewsApi,
  reports: reportsApi,
  chat: chatApi,
  notifications: notificationsApi,
  search: searchApi,
  system: systemApi,
  admin: adminApi,
};


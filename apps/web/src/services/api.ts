/**
 * API Service Layer for TijarahJo
 *
 * Central export surface for domain API modules.
 */

import { authApi } from "./api/auth";
import { categoriesApi } from "./api/categories";
import { chatApi } from "./api/chat";
import { favoritesApi } from "./api/favorites";
import { locationsApi } from "./api/locations";
import { notificationsApi } from "./api/notifications";
import { postsApi } from "./api/posts";
import { reviewsApi } from "./api/reviews";
import { rolesApi } from "./api/roles";
import { searchApi } from "./api/search";
import { sellersApi } from "./api/sellers";
import { usersApi } from "./api/users";
import { adminApi } from "./api/admin";

export const api = {
  auth: authApi,
  posts: postsApi,
  categories: categoriesApi,
  roles: rolesApi,
  favorites: favoritesApi,
  sellers: sellersApi,
  users: usersApi,
  locations: locationsApi,
  reviews: reviewsApi,
  chat: chatApi,
  notifications: notificationsApi,
  search: searchApi,
  admin: adminApi,
};

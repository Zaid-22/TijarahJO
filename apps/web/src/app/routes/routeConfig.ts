export const APP_ROUTE_PATHS = {
  home: "/",
  admin: "/admin",
  login: "/login",
  forgotPassword: "/forgot-password",
  completeProfile: "/complete-profile",
  settings: "/settings",
  favorites: "/favorites",
  sell: "/sell",
  profile: "/profile",
  profileEdit: "/profile/edit",
  chat: "/chat",
  chatUser: "/chat/:userId",
  posts: "/posts",
  search: "/search",
  category: "/category/:categoryName",
  postDetails: "/post/:id",
  sellerProfile: "/seller/:userId",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
  help: "/help",
  notifications: "/notifications",
} as const;

function encodeRouteSegment(value: string): string {
  return encodeURIComponent(String(value).trim());
}

export const APP_ROUTE_BUILDERS = {
  postDetails: (postId: string) =>
    APP_ROUTE_PATHS.postDetails.replace(":id", encodeRouteSegment(postId)),
  sellerProfile: (userId: string) =>
    APP_ROUTE_PATHS.sellerProfile.replace(
      ":userId",
      encodeRouteSegment(userId),
    ),
  chatUser: (userId: string) =>
    APP_ROUTE_PATHS.chatUser.replace(":userId", encodeRouteSegment(userId)),
  category: (categoryName: string) =>
    APP_ROUTE_PATHS.category.replace(
      ":categoryName",
      encodeRouteSegment(categoryName),
    ),
} as const;

export interface AppDataRouteConfig {
  path: string;
  loadsPostsData?: boolean;
  loadsFavoritesData?: boolean;
}

export const APP_DATA_ROUTE_CONFIG: readonly AppDataRouteConfig[] = [
  {
    path: APP_ROUTE_PATHS.home,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.favorites,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.posts,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.search,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.profile,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.category,
    loadsPostsData: true,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.postDetails,
    loadsFavoritesData: true,
  },
  {
    path: APP_ROUTE_PATHS.sellerProfile,
    loadsFavoritesData: true,
  },
] as const;

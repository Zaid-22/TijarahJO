import { type ReactElement } from "react";
import { type NavigateFunction } from "react-router-dom";
import { Language, Post, UserProfile, ViewMode } from "../../types";
import { CreatePostInput } from "./appRoutesUtils";
import type { UpdatePostInput, UpdatePostStatusInput } from "./usePostActions";
import type { EditProfileFormProfile } from "../../features/profile/types";

export interface BaseAppRouteProps {
  language: Language;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
  registrationEnabled: boolean;
}

export interface MarketplaceRouteState {
  availablePosts: Post[];
  filteredPosts: Post[];
  isLoadingPostsFromRouteData: boolean;
  postsError: string | null;
  displayedPosts: Post[];
  favoriteIds: string[];
  toggleFavorite: (postId: string) => void;
  viewMode: ViewMode;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  t: Record<string, string>;
  isRTL: boolean;
  translateCategory: (category: string) => string;
  currentUserId?: string;
}

export interface PostActions {
  createPost: (post: CreatePostInput) => Promise<unknown>;
  updatePost: (post: UpdatePostInput) => Promise<unknown>;
  updatePostStatus: (statusData: UpdatePostStatusInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export interface AppRouteElementsParams {
  language: Language;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
  registrationEnabled: boolean;
  routeState: MarketplaceRouteState;
  postActions: PostActions;
  saveProfile: (profile: EditProfileFormProfile) => Promise<void> | void;
  navigate: NavigateFunction;
  redirectToLogin: () => void;
  promptLoginModal: () => void;
  requireAuth: (element: ReactElement) => ReactElement;
}

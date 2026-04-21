import type { Post } from "../../types";

export interface ProfilePageUserProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  area?: string;
  bio: string;
  avatar?: string;
  joinedDate: string;
}

export interface EditProfileFormProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  location: string;
  bio: string;
  avatar?: string;
}

export interface EditProfileValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  area?: string;
}

export type UnifiedProfileMode = "owner" | "public";

export interface UnifiedProfileReview {
  reviewID: number | string;
  reviewerID: number;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface UnifiedProfileViewModel {
  mode: UnifiedProfileMode;
  profileUserId: string;
  profile: ProfilePageUserProfile;
  canEditProfile: boolean;
  canManageListings: boolean;
  canChat: boolean;
  canCall: boolean;
  canReview: boolean;
  activeListings: Post[];
  soldListings: Post[];
  reviews: UnifiedProfileReview[];
}

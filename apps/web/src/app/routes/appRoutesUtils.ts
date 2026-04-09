import { APP_CONFIG } from "../../constants/appConfig";
import { categoryNameToArabic } from "../../data/categoryTranslations";
import { Language, Post, UserProfile } from "../../types";
import type { PostImageInput } from "../../types/api";
import { matchPath } from "react-router-dom";
import type {
  EditProfileFormProfile,
  ProfilePageUserProfile,
} from "../../features/profile/types";
import { APP_DATA_ROUTE_CONFIG } from "./routeConfig";

export type CreatePostInput = {
  name: string;
  description?: string;
  price: number;
  category: string;
  location?: string;
  area?: string;
  image?: string;
  images?: PostImageInput[];
};

export type UpdatePostInput = CreatePostInput & {
  id: string;
  status: string;
};

function isFileInput(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

interface LoginUserData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  area?: string;
  cityId?: number;
  areaId?: number;
  avatar?: string;
  joinedDate?: string;
}

function normalizeIdentityValue(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function isSameAuthenticatedUser(
  userProfile: UserProfile,
  userData: LoginUserData,
): boolean {
  const nextUserId = normalizeIdentityValue(userData.id);
  const currentUserId = normalizeIdentityValue(userProfile.id);

  if (nextUserId && currentUserId) {
    return nextUserId === currentUserId;
  }

  const nextEmail = normalizeIdentityValue(userData.email);
  const currentEmail = normalizeIdentityValue(userProfile.email);

  return Boolean(nextEmail && currentEmail && nextEmail === currentEmail);
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.trim().toLowerCase().replace(/\/+$/, "");
  return normalized || "/";
}

function matchesRouteDataRequirement(
  pathname: string,
  requirement: "loadsPostsData" | "loadsFavoritesData",
): boolean {
  return APP_DATA_ROUTE_CONFIG.some((routeConfig) => {
    if (!routeConfig[requirement]) {
      return false;
    }

    return Boolean(
      matchPath(
        {
          path: routeConfig.path,
          end: true,
        },
        pathname,
      ),
    );
  });
}

export function shouldLoadPostsForPath(pathname: string): boolean {
  return matchesRouteDataRequirement(
    normalizePathname(pathname),
    "loadsPostsData",
  );
}

export function shouldLoadFavoritesForPath(pathname: string): boolean {
  return matchesRouteDataRequirement(
    normalizePathname(pathname),
    "loadsFavoritesData",
  );
}

export const getCategoryTranslation = (
  category: string,
  language: Language,
): string => {
  if (language === "ar" && categoryNameToArabic[category]) {
    return categoryNameToArabic[category];
  }

  return category;
};

export const decodeCategoryParam = (
  categoryName: string | undefined,
): string => {
  const raw = String(categoryName || "").trim();
  if (!raw) {
    return "";
  }

  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw;
  }
};

export const resolveCurrentUserId = (
  userProfile: UserProfile,
): string | null => {
  const profileId = String(userProfile.id || "").trim();
  if (/^\d+$/.test(profileId)) {
    return profileId;
  }
  return null;
};

const resolvePostCity = (
  userProfile: UserProfile,
  preferredCity?: string,
): string => {
  const city = String(
    preferredCity || userProfile.city || APP_CONFIG.defaultCity,
  ).trim();

  return city || APP_CONFIG.defaultCity;
};

const resolvePostArea = (
  userProfile: UserProfile,
  preferredArea?: string,
): string => String(preferredArea || userProfile.area || "").trim();

const resolvePostPhone = (userProfile: UserProfile): string => {
  const phone = String(
    userProfile.phone || APP_CONFIG.defaultPhonePrefix,
  ).trim();

  return phone || APP_CONFIG.defaultPhonePrefix;
};

export const buildCreatePostPayload = (
  post: CreatePostInput,
  userProfile: UserProfile,
) => ({
  images: (post.images?.length ? post.images : [post.image]).filter(
    (value): value is PostImageInput =>
      (typeof value === "string" && value.trim().length > 0) ||
      isFileInput(value),
  ),
  title: post.name,
  description: post.description || "",
  price: post.price,
  category: post.category,
  city: resolvePostCity(userProfile, post.location),
  area: resolvePostArea(userProfile, post.area),
  phone: resolvePostPhone(userProfile),
});

export const isOwnPostForUser = (
  post: Post,
  userProfile: UserProfile,
  isAuthenticated: boolean,
): boolean => {
  if (!isAuthenticated) {
    return false;
  }

  const normalizedSellerName = String(post.seller || "")
    .trim()
    .toLowerCase();
  const normalizedCurrentUserDisplayName = String(userProfile.name || "")
    .trim()
    .toLowerCase();

  return (
    post.sellerId === userProfile.id ||
    (normalizedSellerName.length > 0 &&
      normalizedSellerName === normalizedCurrentUserDisplayName)
  );
};

export const toProfilePageUserProfile = (
  userProfile: UserProfile,
): ProfilePageUserProfile => ({
  id: userProfile.id,
  name: userProfile.name,
  firstName: userProfile.firstName || "",
  lastName: userProfile.lastName || "",
  email: userProfile.email,
  phone: userProfile.phone,
  location: userProfile.location,
  city: userProfile.city,
  area: userProfile.area,
  bio: userProfile.bio,
  avatar: userProfile.avatar || undefined,
  joinedDate: userProfile.joinedDate,
});

export const toEditProfileFormProfile = (
  userProfile: UserProfile,
): EditProfileFormProfile => ({
  id: userProfile.id,
  name: userProfile.name,
  firstName: userProfile.firstName || "",
  middleName: userProfile.middleName || "",
  lastName: userProfile.lastName || "",
  email: userProfile.email,
  phone: userProfile.phone,
  city: userProfile.city || "",
  area: userProfile.area || "",
  location: userProfile.location,
  bio: userProfile.bio,
  avatar: userProfile.avatar || undefined,
  joinedDate: userProfile.joinedDate,
});

export const applyLoginUserDataToProfile = (
  userProfile: UserProfile,
  userData: LoginUserData,
): UserProfile => {
  const resolvedName =
    `${userData.firstName} ${userData.lastName}`.trim() || userData.email;
  const preserveExistingFields = isSameAuthenticatedUser(userProfile, userData);
  const city = String(
    userData.city || (preserveExistingFields ? userProfile.city : "") || "",
  );
  const area = String(
    userData.area || (preserveExistingFields ? userProfile.area : "") || "",
  );

  return {
    ...userProfile,
    id: userData.id || userProfile.id || userData.email,
    name: resolvedName,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone || (preserveExistingFields ? userProfile.phone : ""),
    city,
    area,
    location: city && area ? `${city}, ${area}` : city,
    avatar: userData.avatar || (preserveExistingFields ? userProfile.avatar : null),
    joinedDate:
      userData.joinedDate || (preserveExistingFields ? userProfile.joinedDate : ""),
  };
};

export const isProfileCompleteForRouting = (
  userProfile: {
    phone?: string;
    city?: string;
    area?: string;
    cityId?: number;
    areaId?: number;
  },
): boolean =>
  Boolean(
    userProfile.phone?.trim() &&
      (
        (userProfile.city?.trim() && userProfile.area?.trim()) ||
        (
          Number.isInteger(userProfile.cityId) &&
          Number(userProfile.cityId) > 0 &&
          Number.isInteger(userProfile.areaId) &&
          Number(userProfile.areaId) > 0
        )
      ),
  );

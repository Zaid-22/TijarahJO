import { APP_CONFIG } from "../../constants/appConfig";

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
  categories: { name: string; nameAr: string }[] = [],
): string => {
  if (language !== "ar" || categories.length === 0) {
    return category;
  }

  const match = categories.find(
    (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase(),
  );

  return match?.nameAr?.trim() || category;
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

export const shouldRouteToProfileCompletion = ({
  isAuthenticated,
  isAuthLoading,
  isProfileLoading,
  isProfileComplete,
  hasProfileError,
}: {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  isProfileComplete: boolean;
  hasProfileError: boolean;
}): boolean =>
  isAuthenticated &&
  !isAuthLoading &&
  !isProfileLoading &&
  !hasProfileError &&
  !isProfileComplete;

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

  const normalizedSellerId = normalizeIdentityValue(post.sellerId);
  const normalizedCurrentUserId = normalizeIdentityValue(userProfile.id);

  // An available stable identifier is authoritative. Display names are not
  // unique and must never override an ID mismatch or a one-sided missing ID.
  if (normalizedSellerId || normalizedCurrentUserId) {
    return Boolean(
      normalizedSellerId &&
        normalizedCurrentUserId &&
        normalizedSellerId === normalizedCurrentUserId,
    );
  }

  const normalizedSellerName = normalizeIdentityValue(post.seller);
  const normalizedCurrentUserDisplayName = normalizeIdentityValue(
    userProfile.name,
  );

  return Boolean(
    normalizedSellerName &&
      normalizedSellerName === normalizedCurrentUserDisplayName,
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
  lastName: userProfile.lastName || "",
  email: userProfile.email,
  phone: userProfile.phone,
  city: userProfile.city || "",
  area: userProfile.area || "",
  location: userProfile.location,
  bio: userProfile.bio,
  avatar: userProfile.avatar || undefined,
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

  const cityId = userData.cityId ?? (preserveExistingFields ? userProfile.cityId : undefined);
  const areaId = userData.areaId ?? (preserveExistingFields ? userProfile.areaId : undefined);

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
    cityId,
    areaId,
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

export const resolveProfileCompletionReturnPath = ({
  pathname,
  search = "",
  fromPath,
}: {
  pathname: string;
  search?: string;
  fromPath?: unknown;
}): string => {
  const normalizeInternalPath = (value: unknown): string => {
    if (typeof value !== "string") {
      return "";
    }

    const normalized = value.trim();
    return normalized.startsWith("/") &&
      !normalized.startsWith("//") &&
      !normalized.includes("\\")
      ? normalized
      : "";
  };

  const normalizedPathname = normalizeInternalPath(pathname) || "/";
  const currentPath = `${normalizedPathname}${search}`;
  const currentPathname = (
    normalizedPathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
  ).toLowerCase();
  const statePath = normalizeInternalPath(fromPath);
  const candidate =
    currentPathname === "/login" || currentPathname === "/complete-profile"
      ? statePath || "/"
      : currentPath;
  const candidatePathname = (
    candidate.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/"
  ).toLowerCase();

  return candidatePathname === "/login" ||
    candidatePathname === "/complete-profile"
    ? "/"
    : candidate;
};

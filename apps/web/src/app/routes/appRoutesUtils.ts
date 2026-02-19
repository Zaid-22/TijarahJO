import { APP_CONFIG } from "../../constants/appConfig";
import { categoryNameToArabic } from "../../data/categoryTranslations";
import { Language, Product, UserProfile } from "../../types";

export const ROUTES_REQUIRING_MARKETPLACE_DATA = new Set([
  "favorites",
  "sell",
  "products",
  "search",
  "profile",
  "category",
  "product",
]);

export type CreatePostInput = {
  name: string;
  description?: string;
  price: number;
  category: string;
  location?: string;
  area?: string;
  image?: string;
  images?: string[];
};

export interface LoginUserData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  joinedDate?: string;
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

export const decodeCategoryParam = (categoryName: string | undefined): string => {
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

const resolvePostCity = (userProfile: UserProfile, preferredCity?: string): string => {
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
  product: CreatePostInput,
  userProfile: UserProfile,
) => ({
  images: (product.images?.length ? product.images : [product.image]).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  ),
  title: product.name,
  description: product.description || "",
  price: product.price,
  category: product.category,
  city: resolvePostCity(userProfile, product.location),
  area: resolvePostArea(userProfile, product.area),
  phone: resolvePostPhone(userProfile),
});

export const isOwnProductForUser = (
  product: Product,
  userProfile: UserProfile,
  isAuthenticated: boolean,
): boolean => {
  if (!isAuthenticated) {
    return false;
  }

  const normalizedSellerName = String(product.seller || "")
    .trim()
    .toLowerCase();
  const normalizedCurrentUserDisplayName = String(userProfile.name || "")
    .trim()
    .toLowerCase();

  return (
    product.sellerId === userProfile.id ||
    (normalizedSellerName.length > 0 &&
      normalizedSellerName === normalizedCurrentUserDisplayName)
  );
};

export const toProfilePageUserProfile = (userProfile: UserProfile) => ({
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
  avatar: userProfile.avatar,
  joinedDate: userProfile.joinedDate,
});

export const toEditProfileFormProfile = (userProfile: UserProfile) => ({
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
  avatar: userProfile.avatar,
  joinedDate: userProfile.joinedDate,
});

export const applyLoginUserDataToProfile = (
  userProfile: UserProfile,
  userData: LoginUserData,
): UserProfile => {
  const resolvedName =
    `${userData.firstName} ${userData.lastName}`.trim() || userData.email;

  return {
    ...userProfile,
    id: userData.id || userProfile.id || userData.email,
    name: resolvedName,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone || userProfile.phone,
    avatar: userData.avatar || userProfile.avatar,
    joinedDate: userData.joinedDate || userProfile.joinedDate,
  };
};

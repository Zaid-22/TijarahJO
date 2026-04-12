import {
  apiRequest,
  hasLikelyAdminSession,
  hasLikelyAuthenticatedSession,
} from "../client";
import { locationsApi } from "../locations";
import { parseRawReviewsCollection } from "../schemas/reviewSchema";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { getUserDisplayName, getUserIdentifier } from "./mappers";
import { RawCategory, RawPost, RawUserLookup } from "./types";

let categoriesCache: Record<string, string> | null = null;
let categoryIdByNameCache: Record<string, number> | null = null;
let usersCache: Record<string, string> | null = null;
let usersAllEndpointAccessible: boolean | null = null;

let categoriesCacheUpdatedAt = 0;
let usersCacheUpdatedAt = 0;
const sellerRatingsCache: Record<
  string,
  { averageRating: number; reviewCount: number; updatedAt: number }
> = {};

let citiesCache: Record<string, { en: string; ar: string }> | null = null;
let citiesCacheUpdatedAt = 0;
const areasCacheByCityId: Record<
  string,
  Record<string, { en: string; ar: string }>
> = {};

const USERS_ENDPOINT = "/users";
const LOOKUP_CACHE_TTL_MS = 60_000;

function isCacheFresh(updatedAt: number): boolean {
  return updatedAt > 0 && Date.now() - updatedAt < LOOKUP_CACHE_TTL_MS;
}

async function ensureSellerRatingsCache(
  forceRefresh: boolean = false,
  userIds: Array<string | number> = [],
): Promise<Record<string, { averageRating: number; reviewCount: number }>> {
  const requestedUserIds = Array.from(
    new Set(
      userIds
        .map((id) => String(id).trim())
        .filter((id) => toPositiveIntegerId(id)),
    ),
  );

  const staleOrMissingUserIds = requestedUserIds.filter((userId) => {
    const entry = sellerRatingsCache[userId];
    return forceRefresh || !entry || !isCacheFresh(entry.updatedAt);
  });

  if (staleOrMissingUserIds.length > 0) {
    await Promise.all(
      staleOrMissingUserIds.map(async (userId) => {
        const response = await apiRequest<unknown>(`/reviews/user/${userId}`, {
          method: "GET",
        });

        const reviews = response.success
          ? parseRawReviewsCollection(response.data)
          : [];
        const validRatings = reviews
          .map((review) => Number(review.Rating ?? review.rating ?? 0))
          .filter((rating) => Number.isFinite(rating) && rating > 0)
          .map((rating) => Math.min(5, Math.max(1, rating)));
        const reviewCount = validRatings.length;
        const averageRating =
          reviewCount > 0
            ? validRatings.reduce((sum, rating) => sum + rating, 0) / reviewCount
            : 0;

        sellerRatingsCache[userId] = {
          averageRating,
          reviewCount,
          updatedAt: Date.now(),
        };
      }),
    );
  }

  return Object.fromEntries(
    requestedUserIds.map((userId) => [
      userId,
      {
        averageRating: sellerRatingsCache[userId]?.averageRating ?? 0,
        reviewCount: sellerRatingsCache[userId]?.reviewCount ?? 0,
      },
    ]),
  );
}

function normalizeCategoryNameKey(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

async function ensureCategoriesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, string>> {
  if (!forceRefresh && categoriesCache && isCacheFresh(categoriesCacheUpdatedAt)) {
    return categoriesCache;
  }

  const categoriesResponse = await apiRequest<RawCategory[]>("/categories", {
    method: "GET",
  });

  if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
    const nextCategoriesCache: Record<string, string> = {};
    const nextCategoryIdByNameCache: Record<string, number> = {};

    categoriesResponse.data.forEach((category) => {
      const categoryId = toPositiveIntegerId(
        category?.CategoryID ?? category?.categoryID ?? category?.id,
      );
      const rawCategoryName =
        category?.CategoryName ?? category?.categoryName ?? category?.name;
      const categoryName =
        typeof rawCategoryName === "string" ? rawCategoryName.trim() : "";

      if (categoryId && categoryName.length > 0) {
        nextCategoriesCache[String(categoryId)] = categoryName;
        nextCategoryIdByNameCache[normalizeCategoryNameKey(categoryName)] =
          categoryId;
      }
    });

    categoriesCache = nextCategoriesCache;
    categoryIdByNameCache = nextCategoryIdByNameCache;
    categoriesCacheUpdatedAt = Date.now();
    return categoriesCache;
  }

  categoriesCache ||= {};
  categoryIdByNameCache ||= {};
  return categoriesCache;
}

async function ensureUsersCache(
  forceRefresh: boolean = false,
  userIds: Array<string | number> = [],
): Promise<Record<string, string>> {
  usersCache ||= {};

  const requestedUserIds = Array.from(
    new Set(
      userIds
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0 && id !== "0"),
    ),
  );

  const shouldRefreshAllUsersCache =
    forceRefresh ||
    !isCacheFresh(usersCacheUpdatedAt) ||
    Object.keys(usersCache).length === 0;

  let canQueryUserProfiles = hasLikelyAuthenticatedSession();
  let canQueryUsersListEndpoint =
    hasLikelyAdminSession() && usersAllEndpointAccessible !== false;

  if (shouldRefreshAllUsersCache && canQueryUsersListEndpoint) {
    const usersResponse = await apiRequest<RawUserLookup[]>(USERS_ENDPOINT, {
      method: "GET",
    });

    if (usersResponse.success && Array.isArray(usersResponse.data)) {
      const nextCache: Record<string, string> = {};
      usersResponse.data.forEach((user) => {
        const userId = getUserIdentifier(user);
        if (!userId) {
          return;
        }

        nextCache[userId] = getUserDisplayName(user, userId);
      });

      usersCache = nextCache;
      usersCacheUpdatedAt = Date.now();
      usersAllEndpointAccessible = true;
    } else if (!usersResponse.success) {
      const errorCode = usersResponse.error?.code || "";
      if (errorCode === "HTTP_401" || errorCode === "HTTP_403") {
        usersAllEndpointAccessible = false;
        canQueryUsersListEndpoint = false;
      }
    }
  }

  const missingUserIds = requestedUserIds.filter((id) => !usersCache?.[id]);

  if (missingUserIds.length > 0) {
    if (!canQueryUserProfiles) {
      missingUserIds.forEach((userId) => {
        usersCache![userId] = `User ${userId}`;
      });
      usersCacheUpdatedAt = Date.now();
      return usersCache;
    }

    await Promise.all(
      missingUserIds.map(async (userId) => {
        const userResponse = await apiRequest<RawUserLookup>(`/users/${userId}`, {
          method: "GET",
        });

        if (userResponse.success && userResponse.data) {
          const resolvedUserId = getUserIdentifier(userResponse.data) || userId;
          const displayName = getUserDisplayName(
            userResponse.data,
            resolvedUserId,
          );

          usersCache![resolvedUserId] = displayName;
          usersCache![userId] = displayName;
          return;
        }

        if (!userResponse.success) {
          const errorCode = userResponse.error?.code || "";
          if (errorCode === "HTTP_401" || errorCode === "HTTP_403") {
            canQueryUserProfiles = false;
          }
        }

        usersCache![userId] = `User ${userId}`;
      }),
    );
    usersCacheUpdatedAt = Date.now();
  }

  return usersCache;
}

async function ensureCitiesCache(
  forceRefresh: boolean = false,
): Promise<Record<string, { en: string; ar: string }>> {
  if (!forceRefresh && citiesCache && isCacheFresh(citiesCacheUpdatedAt)) {
    return citiesCache;
  }

  const cities = await locationsApi.getCities();
  const nextCache: Record<string, { en: string; ar: string }> = {};
  cities.forEach((city) => {
    nextCache[String(city.cityId)] = { en: city.cityName, ar: city.cityNameAr };
  });

  citiesCache = nextCache;
  citiesCacheUpdatedAt = Date.now();
  return citiesCache;
}

async function ensureAreasCache(
  cityId: number,
  forceRefresh: boolean = false,
): Promise<Record<string, { en: string; ar: string }>> {
  const cityKey = String(cityId);
  if (!forceRefresh && areasCacheByCityId[cityKey]) {
    return areasCacheByCityId[cityKey];
  }

  const areas = await locationsApi.getAreasByCity(cityId);
  const nextCache: Record<string, { en: string; ar: string }> = {};
  areas.forEach((area) => {
    nextCache[String(area.areaId)] = { en: area.areaName, ar: area.areaNameAr };
  });

  areasCacheByCityId[cityKey] = nextCache;
  return areasCacheByCityId[cityKey];
}

function resolveLookupIdByName(
  entries: Array<[string, { en: string; ar: string }]>,
  normalizedValue: string,
): number | undefined {
  for (const [id, names] of entries) {
    if (
      names.en.toLowerCase() === normalizedValue ||
      names.ar.toLowerCase() === normalizedValue ||
      id === normalizedValue
    ) {
      return toPositiveIntegerId(id);
    }
  }

  for (const [id, names] of entries) {
    if (
      names.en.toLowerCase().startsWith(normalizedValue) ||
      names.ar.toLowerCase().startsWith(normalizedValue)
    ) {
      return toPositiveIntegerId(id);
    }
  }

  for (const [id, names] of entries) {
    if (
      names.en.toLowerCase().includes(normalizedValue) ||
      names.ar.toLowerCase().includes(normalizedValue)
    ) {
      return toPositiveIntegerId(id);
    }
  }

  return undefined;
}

export async function resolveCategoryId(
  categoryValue: unknown,
  forceRefresh: boolean = false,
): Promise<number | undefined> {
  const numericCategoryId = toPositiveIntegerId(categoryValue);
  if (numericCategoryId) {
    return numericCategoryId;
  }

  if (typeof categoryValue !== "string") {
    return undefined;
  }

  const normalizedCategoryName = normalizeCategoryNameKey(categoryValue);
  if (!normalizedCategoryName) {
    return undefined;
  }

  await ensureCategoriesCache(forceRefresh);
  return toPositiveIntegerId(categoryIdByNameCache?.[normalizedCategoryName]);
}

export async function resolveCityId(
  cityValue: unknown,
  forceRefresh: boolean = false,
): Promise<number | undefined> {
  const numericCityId = toPositiveIntegerId(cityValue);
  if (numericCityId) {
    return numericCityId;
  }

  if (typeof cityValue !== "string" || !cityValue.trim()) {
    return undefined;
  }

  const normalizedCity = cityValue.trim().toLowerCase();
  const cachedCities = await ensureCitiesCache(forceRefresh);
  return resolveLookupIdByName(Object.entries(cachedCities), normalizedCity);
}

export async function resolveAreaId(
  cityId: number,
  areaValue: unknown,
  forceRefresh: boolean = false,
): Promise<number | undefined> {
  const numericAreaId = toPositiveIntegerId(areaValue);
  if (numericAreaId) {
    return numericAreaId;
  }

  if (typeof areaValue !== "string" || !areaValue.trim()) {
    return undefined;
  }

  const normalizedArea = areaValue.trim().toLowerCase();
  const cachedAreas = await ensureAreasCache(cityId, forceRefresh);
  return resolveLookupIdByName(Object.entries(cachedAreas), normalizedArea);
}

export async function enrichPostsWithCategoryAndSeller(
  posts: RawPost[],
  forceRefresh: boolean = false,
): Promise<RawPost[]> {
  const postUserIds: Array<string | number> = posts
    .map(
      (post) =>
        post?.UserID ??
        post?.userID ??
        post?.UserId ??
        post?.sellerId ??
        post?.SellerId ??
        post?.SellerID,
    )
    .filter(
      (id): id is string | number =>
        (typeof id === "string" || typeof id === "number") &&
        id !== null &&
        id !== undefined &&
        String(id).trim() !== "" &&
        String(id) !== "0",
    );

  const postCityIds = Array.from(
    new Set(
      posts
        .map((post) => post?.CityId ?? post?.cityId)
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  const [resolvedCategories, resolvedUsers, resolvedCities, resolvedSellerRatings] = await Promise.all([
    ensureCategoriesCache(forceRefresh),
    ensureUsersCache(forceRefresh, postUserIds),
    ensureCitiesCache(forceRefresh),
    ensureSellerRatingsCache(forceRefresh, postUserIds),
  ]);

  await Promise.all(
    postCityIds.map((cityId) => ensureAreasCache(cityId, forceRefresh)),
  );

  return posts.map((post) => {
    const categoryId = post?.CategoryID ?? post?.categoryID ?? post?.CategoryId;
    const userId =
      post?.UserID ??
      post?.userID ??
      post?.UserId ??
      post?.sellerId ??
      post?.SellerId ??
      post?.SellerID;

    let categoryName = String(post?.Category || post?.category || "").trim();
    if (!categoryName) {
      categoryName =
        categoryId !== null && categoryId !== undefined
          ? resolvedCategories[String(categoryId)] || "Unknown"
          : "Unknown";
    }

    const existingSeller =
      typeof (post?.Seller ?? post?.seller) === "string"
        ? String(post?.Seller ?? post?.seller).trim()
        : "";
    let sellerName = existingSeller;
    if (!sellerName) {
      sellerName =
        userId !== null && userId !== undefined
          ? resolvedUsers[String(userId)] || `User ${userId}`
          : "Unknown";
    }

    const cityId = post?.CityId ?? post?.cityId;
    const areaId = post?.AreaId ?? post?.areaId;
    const sellerRating =
      userId !== null && userId !== undefined
        ? resolvedSellerRatings[String(userId)]
        : undefined;

    let cityName =
      typeof (post?.City ?? post?.city) === "string"
        ? String(post?.City ?? post?.city).trim()
        : "";
    let cityNameAr =
      typeof (post?.LocationAr ?? post?.locationAr) === "string"
        ? String(post?.LocationAr ?? post?.locationAr).trim()
        : "";
    if (cityId !== null && cityId !== undefined) {
      const cityEntry = resolvedCities[String(cityId)];
      if (!cityName && cityEntry) {
        cityName = cityEntry.en || "";
      }
      if (!cityNameAr && cityEntry) {
        cityNameAr = cityEntry.ar || "";
      }
    }

    let areaName =
      typeof (post?.Area ?? post?.area) === "string"
        ? String(post?.Area ?? post?.area).trim()
        : "";
    let areaNameAr =
      typeof (post?.AreaAr ?? post?.areaAr) === "string"
        ? String(post?.AreaAr ?? post?.areaAr).trim()
        : "";
    if (
      areaId !== null &&
      areaId !== undefined &&
      cityId !== null &&
      cityId !== undefined
    ) {
      const cityAreas = areasCacheByCityId[String(cityId)] || {};
      const areaEntry = cityAreas[String(areaId)];
      if (!areaName && areaEntry) {
        areaName = areaEntry.en || "";
      }
      if (!areaNameAr && areaEntry) {
        areaNameAr = areaEntry.ar || "";
      }
    }

    return {
      ...post,
      Category: categoryName,
      Seller: sellerName,
      City: cityName || post?.City,
      LocationAr: cityNameAr || post?.LocationAr || post?.locationAr,
      Area: areaName || post?.Area,
      AreaAr: areaNameAr || post?.AreaAr || post?.areaAr,
      AverageRating:
        sellerRating && sellerRating.reviewCount > 0
          ? sellerRating.averageRating
          : undefined,
      ReviewCount:
        sellerRating && sellerRating.reviewCount > 0
          ? sellerRating.reviewCount
          : undefined,
    };
  });
}

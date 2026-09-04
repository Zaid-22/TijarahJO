/* eslint-disable max-lines */
import {
  apiRequest,
  hasLikelyAdminSession,
  hasLikelyAuthenticatedSession,
} from "../client";
import { categoriesApi } from "../categories";
import { locationsApi } from "../locations";
import { toPositiveIntegerId } from "../../../utils/idValidation";
import { getUserDisplayName, getUserIdentifier } from "./mappers";
import { RawPost, RawUserLookup } from "./types";

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
const OPTIONAL_RATINGS_WAIT_MS = 750;

// ---------------------------------------------------------------------------
// In-flight deduplication — when multiple callers race to fetch the same
// resource before the first response arrives, they all share one Promise
// instead of each firing a separate HTTP request (which causes 429 bursts).
// ---------------------------------------------------------------------------
let _citiesInflight: Promise<Record<string, { en: string; ar: string }>> | null = null;
// Ratings inflight key: sorted comma-separated user IDs (cache key for the batch)
const _ratingsInflight: Map<string, Promise<void>> = new Map();
// Areas inflight key: cityId string — shared across concurrent callers for the same city.
const _areasInflight: Map<string, Promise<Record<string, { en: string; ar: string }>>> = new Map();
// Individual user profile fetches — deduplicates the non-admin per-user fallback.
const _usersIndividualInflight: Map<string, Promise<void>> = new Map();

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

  if (requestedUserIds.length === 0) {
    return {};
  }

  const staleOrMissingUserIds = requestedUserIds.filter((userId) => {
    const entry = sellerRatingsCache[userId];
    return forceRefresh || !entry || !isCacheFresh(entry.updatedAt);
  });

  if (staleOrMissingUserIds.length > 0) {
    // Deduplicate: use a sorted key so two callers with the same set of IDs
    // share a single in-flight request.
    const inflightKey = [...staleOrMissingUserIds].sort().join(",");
    let inflight = _ratingsInflight.get(inflightKey);
    if (!inflight) {
      inflight = (async () => {
        const qs = staleOrMissingUserIds.join(",");
        const response = await apiRequest<Record<string, { AverageRating: number; ReviewCount: number }>>(
          `/reviews/ratings?userIds=${encodeURIComponent(qs)}`,
          { method: "GET" },
        );

        const now = Date.now();
        if (response.success && response.data && typeof response.data === "object") {
          for (const [userId, stat] of Object.entries(response.data)) {
            const avg = Number(stat?.AverageRating ?? 0);
            const count = Number(stat?.ReviewCount ?? 0);
            sellerRatingsCache[userId] = {
              averageRating: Number.isFinite(avg) ? Math.min(5, Math.max(0, avg)) : 0,
              reviewCount: Number.isFinite(count) && count > 0 ? count : 0,
              updatedAt: now,
            };
          }
        }

        // Users with no reviews won't appear in the response — mark them cached with zero
        for (const userId of staleOrMissingUserIds) {
          if (!sellerRatingsCache[userId] || sellerRatingsCache[userId].updatedAt !== now) {
            sellerRatingsCache[userId] = { averageRating: 0, reviewCount: 0, updatedAt: now };
          }
        }
      })().finally(() => _ratingsInflight.delete(inflightKey));
      _ratingsInflight.set(inflightKey, inflight);
    }
    await inflight;
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

function readCachedSellerRatings(
  userIds: Array<string | number>,
): Record<string, { averageRating: number; reviewCount: number }> {
  return Object.fromEntries(
    userIds.map((id) => String(id).trim()).filter(Boolean).map((userId) => [
      userId,
      {
        averageRating: sellerRatingsCache[userId]?.averageRating ?? 0,
        reviewCount: sellerRatingsCache[userId]?.reviewCount ?? 0,
      },
    ]),
  );
}

async function resolveSellerRatingsWithoutBlockingListings(
  userIds: Array<string | number>,
  forceRefresh: boolean,
): Promise<Record<string, { averageRating: number; reviewCount: number }>> {
  if (userIds.length === 0) {
    return {};
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutResult = new Promise<
    Record<string, { averageRating: number; reviewCount: number }>
  >((resolve) => {
    timeoutId = setTimeout(
      () => resolve(readCachedSellerRatings(userIds)),
      OPTIONAL_RATINGS_WAIT_MS,
    );
  });

  try {
    return await Promise.race([
      ensureSellerRatingsCache(forceRefresh, userIds),
      timeoutResult,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
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

  const categoriesResponse = await categoriesApi.getCategories();

  if (categoriesResponse.success) {
    const nextCategoriesCache: Record<string, string> = {};
    const nextCategoryIdByNameCache: Record<string, number> = {};

    categoriesResponse.categories.forEach((category) => {
      const categoryId = toPositiveIntegerId(category.id);
      const categoryName = category.name.trim();

      if (categoryId && categoryName.length > 0) {
        nextCategoriesCache[String(categoryId)] = categoryName;
        nextCategoryIdByNameCache[normalizeCategoryNameKey(categoryName)] =
          categoryId;
      }
    });

    categoriesCache = nextCategoriesCache;
    categoryIdByNameCache = nextCategoryIdByNameCache;
    categoriesCacheUpdatedAt = Date.now();
  } else {
    categoriesCache ||= {};
    categoryIdByNameCache ||= {};
  }

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

  if (requestedUserIds.length === 0) {
    return usersCache;
  }

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
        // Deduplicate: if another caller is already fetching this user profile, share the promise.
        let inflight = _usersIndividualInflight.get(userId);
        if (!inflight) {
          inflight = (async () => {
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
          })().finally(() => _usersIndividualInflight.delete(userId));
          _usersIndividualInflight.set(userId, inflight);
        }
        await inflight;
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

  // Deduplicate: if another caller is already fetching, return the same promise.
  if (!forceRefresh && _citiesInflight) {
    return _citiesInflight;
  }

  _citiesInflight = (async () => {
    const cities = await locationsApi.getCities();
    const nextCache: Record<string, { en: string; ar: string }> = {};
    cities.forEach((city) => {
      nextCache[String(city.cityId)] = { en: city.cityName, ar: city.cityNameAr };
    });

    citiesCache = nextCache;
    citiesCacheUpdatedAt = Date.now();
    return citiesCache;
  })().finally(() => { _citiesInflight = null; });

  return _citiesInflight;
}

async function ensureAreasCache(
  cityId: number,
  forceRefresh: boolean = false,
): Promise<Record<string, { en: string; ar: string }>> {
  const cityKey = String(cityId);
  if (!forceRefresh && areasCacheByCityId[cityKey]) {
    return areasCacheByCityId[cityKey];
  }

  // Deduplicate: if another caller is already fetching areas for this city, share the promise.
  let inflight = _areasInflight.get(cityKey);
  if (!forceRefresh && inflight) {
    return inflight;
  }

  inflight = (async () => {
    const areas = await locationsApi.getAreasByCity(cityId);
    const nextCache: Record<string, { en: string; ar: string }> = {};
    areas.forEach((area) => {
      nextCache[String(area.areaId)] = { en: area.areaName, ar: area.areaNameAr };
    });
    areasCacheByCityId[cityKey] = nextCache;
    return areasCacheByCityId[cityKey];
  })().finally(() => { _areasInflight.delete(cityKey); });
  _areasInflight.set(cityKey, inflight);

  return inflight;
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
  const resolvePostUserId = (post: RawPost) =>
    post?.UserID ??
    post?.userID ??
    post?.UserId ??
    post?.sellerId ??
    post?.SellerId ??
    post?.SellerID;
  const isUsableLookupId = (id: unknown): id is string | number =>
    (typeof id === "string" || typeof id === "number") &&
    String(id).trim() !== "" &&
    String(id) !== "0";
  const hasText = (...values: unknown[]) =>
    values.some(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

  const postUserIds: Array<string | number> = posts
    .map(resolvePostUserId)
    .filter(isUsableLookupId);
  const sellerLookupUserIds: Array<string | number> = posts
    .filter((post) => !hasText(post?.Seller, post?.seller))
    .map(resolvePostUserId)
    .filter(isUsableLookupId);
  const needsCategoryLookup = posts.some(
    (post) =>
      !hasText(post?.Category, post?.category) &&
      isUsableLookupId(
        post?.CategoryID ?? post?.categoryID ?? post?.CategoryId,
      ),
  );
  const needsCityLookup = posts.some(
    (post) =>
      !hasText(post?.City, post?.city, post?.LocationAr, post?.locationAr) &&
      toPositiveIntegerId(post?.CityId ?? post?.cityId),
  );

  const postCityIds = Array.from(
    new Set(
      posts
        .filter(
          (post) =>
            !hasText(post?.Area, post?.area, post?.AreaAr, post?.areaAr),
        )
        .map((post) => post?.CityId ?? post?.cityId)
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  const [resolvedCategories, resolvedUsers, resolvedCities, resolvedSellerRatings] = await Promise.all([
    needsCategoryLookup
      ? ensureCategoriesCache(forceRefresh)
      : Promise.resolve(categoriesCache ?? {}),
    ensureUsersCache(forceRefresh, sellerLookupUserIds),
    needsCityLookup
      ? ensureCitiesCache(forceRefresh)
      : Promise.resolve(citiesCache ?? {}),
    resolveSellerRatingsWithoutBlockingListings(postUserIds, forceRefresh),
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

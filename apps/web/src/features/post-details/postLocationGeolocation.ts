import type { Coordinates } from "./postLocationMapUtils";

const USER_LOCATION_CACHE_KEY = "tijarahjo_post_map_user_location";
const USER_LOCATION_CACHE_TTL_MS = 60 * 60 * 1000;

export function readCachedUserLocation(): Coordinates | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(USER_LOCATION_CACHE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<Coordinates> & {
      savedAt?: number;
    };
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > USER_LOCATION_CACHE_TTL_MS
    ) {
      window.localStorage.removeItem(USER_LOCATION_CACHE_KEY);
      return null;
    }

    return {
      lat: parsed.lat,
      lng: parsed.lng,
    };
  } catch {
    window.localStorage.removeItem(USER_LOCATION_CACHE_KEY);
    return null;
  }
}

export function cacheUserLocation(location: Coordinates) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    USER_LOCATION_CACHE_KEY,
    JSON.stringify({ ...location, savedAt: Date.now() }),
  );
}

export function clearCachedUserLocation() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_LOCATION_CACHE_KEY);
}

export async function canUseCachedUserLocation(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return false;
  }

  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    return false;
  }
}

export function getBrowserLocation(): Promise<Coordinates> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not available."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => reject(new Error("Geolocation permission was not granted.")),
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 10_000,
      },
    );
  });
}

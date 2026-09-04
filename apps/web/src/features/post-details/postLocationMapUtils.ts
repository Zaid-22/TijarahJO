import type { Language, Post } from "../../types";

const JORDAN_EN = "Jordan";
const JORDAN_AR = "الأردن";

export interface PostMapDestination {
  query: string;
  displayLabel: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteMetrics {
  distanceMeters: number;
  durationSeconds: number;
}

const normalizeLocationPart = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const lowered = trimmed.toLowerCase();
  if (lowered === "null" || lowered === "undefined" || lowered === "n/a") {
    return "";
  }

  return trimmed;
};

const isJordanLabel = (value: string): boolean =>
  [JORDAN_EN.toLowerCase(), JORDAN_AR].includes(value.trim().toLowerCase());

const uniqueLocationParts = (parts: string[]): string[] => {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const normalized = part.toLowerCase();
    if (!part || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
};

export function buildPostMapDestination(
  post: Pick<Post, "area" | "areaAr" | "location" | "locationAr">,
  language: Language,
): PostMapDestination | null {
  const queryArea = normalizeLocationPart(post.area) || normalizeLocationPart(post.areaAr);
  const queryCity =
    normalizeLocationPart(post.location) || normalizeLocationPart(post.locationAr);
  const displayArea =
    language === "ar"
      ? normalizeLocationPart(post.areaAr) || normalizeLocationPart(post.area)
      : normalizeLocationPart(post.area) || normalizeLocationPart(post.areaAr);
  const displayCity =
    language === "ar"
      ? normalizeLocationPart(post.locationAr) || normalizeLocationPart(post.location)
      : normalizeLocationPart(post.location) || normalizeLocationPart(post.locationAr);

  const queryParts = uniqueLocationParts(
    [queryArea, queryCity].filter((part) => part && !isJordanLabel(part)),
  );

  if (queryParts.length === 0) {
    return null;
  }

  const displayParts = uniqueLocationParts(
    [displayArea, displayCity].filter((part) => part && !isJordanLabel(part)),
  );

  return {
    query: [...queryParts, JORDAN_EN].join(", "),
    displayLabel:
      displayParts.length > 0
        ? displayParts.join(", ")
        : language === "ar"
          ? JORDAN_AR
          : JORDAN_EN,
  };
}

export function buildGoogleMapsSearchUrl(destinationQuery: string): string {
  const query = encodeURIComponent(destinationQuery);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildGoogleMapsDirectionsUrl(
  destinationQuery: string,
  origin?: Coordinates | null,
): string {
  const destination = encodeURIComponent(destinationQuery);
  const originPart = origin
    ? `&origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}`
    : "";
  return `https://www.google.com/maps/dir/?api=1${originPart}&destination=${destination}&travelmode=driving`;
}

function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(language === "ar" ? "ar-JO" : "en-US", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value);
}

export function formatDistance(distanceMeters: number, language: Language): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return "";
  }

  if (distanceMeters < 1000) {
    const meters = Math.max(1, Math.round(distanceMeters));
    return language === "ar"
      ? `${formatNumber(meters, language)} م`
      : `${formatNumber(meters, language)} m`;
  }

  const kilometers = distanceMeters / 1000;
  return language === "ar"
    ? `${formatNumber(kilometers, language)} كم`
    : `${formatNumber(kilometers, language)} km`;
}

export function formatDuration(durationSeconds: number, language: Language): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return "";
  }

  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  if (totalMinutes < 60) {
    return language === "ar"
      ? `${formatNumber(totalMinutes, language)} دقيقة`
      : `${formatNumber(totalMinutes, language)} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourLabel =
    language === "ar"
      ? `${formatNumber(hours, language)} ساعة`
      : `${formatNumber(hours, language)} hr`;

  if (minutes === 0) {
    return hourLabel;
  }

  return language === "ar"
    ? `${hourLabel} ${formatNumber(minutes, language)} دقيقة`
    : `${hourLabel} ${formatNumber(minutes, language)} min`;
}

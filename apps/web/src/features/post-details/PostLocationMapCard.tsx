import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Car, ExternalLink, Loader2, MapPin, Navigation } from "lucide-react";
import { APP_CONFIG } from "../../constants/appConfig";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { Button } from "../../shared/ui/button";
import { Card, CardContent } from "../../shared/ui/card";
import { cn } from "../../shared/ui/utils";
import type { Language, Post } from "../../types";
import {
  applyPostMapTheme,
  calculateDrivingRouteMetrics,
  createPostMap,
  geocodeDestination,
  hasGoogleMapsGlobal,
  loadGoogleMapsApi,
} from "./googleMapsClient";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
  buildPostMapDestination,
  formatDistance,
  formatDuration,
  type Coordinates,
  type RouteMetrics,
} from "./postLocationMapUtils";

interface PostLocationMapCardProps {
  post: Post;
  language: Language;
  isRTL: boolean;
}

type MapStatus = "idle" | "loading" | "ready" | "error";
type RouteStatus = "idle" | "loading" | "success" | "error";

const USER_LOCATION_CACHE_KEY = "tijarahjo_post_map_user_location";
const USER_LOCATION_CACHE_TTL_MS = 60 * 60 * 1000;

const copy = {
  en: {
    title: "Location",
    openMaps: "Open in Google Maps",
    mapPreview: "Open location in Google Maps",
    useLocation: "Use my location",
    prompt: "Use my location to see distance and time.",
    loadingRoute: "Calculating distance and travel time...",
    routeError: "Could not calculate distance right now.",
    mapUnavailable: "Google Maps is not configured yet.",
    locationUnavailable: "Your browser could not share location.",
  },
  ar: {
    title: "الموقع",
    openMaps: "افتح في خرائط Google",
    mapPreview: "افتح الموقع في خرائط Google",
    useLocation: "استخدم موقعي",
    prompt: "استخدم موقعك لمعرفة المسافة والوقت.",
    loadingRoute: "جارٍ حساب المسافة ووقت الوصول...",
    routeError: "تعذر حساب المسافة حالياً.",
    mapUnavailable: "لم يتم إعداد خرائط Google بعد.",
    locationUnavailable: "تعذر الوصول إلى موقعك من المتصفح.",
  },
} as const;

function readCachedUserLocation(): Coordinates | null {
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

function cacheUserLocation(location: Coordinates) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    USER_LOCATION_CACHE_KEY,
    JSON.stringify({ ...location, savedAt: Date.now() }),
  );
}

function clearCachedUserLocation() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_LOCATION_CACHE_KEY);
}

async function canUseCachedUserLocation(): Promise<boolean> {
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

function getBrowserLocation(): Promise<Coordinates> {
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

export function PostLocationMapCard({
  post,
  language,
  isRTL,
}: PostLocationMapCardProps) {
  const { darkMode } = useAppSettings();
  const labels = copy[language];
  const destination = useMemo(
    () => buildPostMapDestination(post, language),
    [post, language],
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<ReturnType<typeof createPostMap>["map"] | null>(null);
  const markerRef = useRef<ReturnType<typeof createPostMap>["marker"] | null>(
    null,
  );
  const destinationCoordinatesRef = useRef<Coordinates | null>(null);
  const darkModeRef = useRef(darkMode);
  const routeRequestIdRef = useRef(0);
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle");
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const [routeError, setRouteError] = useState("");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const hasGoogleMapsSupport =
    Boolean(APP_CONFIG.googleMapsApiKey) || hasGoogleMapsGlobal();

  const googleMapsUrl = destination
    ? userLocation
      ? buildGoogleMapsDirectionsUrl(destination.query, userLocation)
      : buildGoogleMapsSearchUrl(destination.query)
    : "";

  useEffect(() => {
    routeRequestIdRef.current += 1;
    setRouteStatus("idle");
    setRouteMetrics(null);
    setRouteError("");
    setUserLocation(null);
  }, [destination?.query]);

  useEffect(() => {
    let cancelled = false;
    markerRef.current?.setMap(null);
    markerRef.current = null;
    mapRef.current = null;
    destinationCoordinatesRef.current = null;
    setMapStatus("idle");

    if (!destination || !mapContainerRef.current || !hasGoogleMapsSupport) {
      return () => {
        cancelled = true;
      };
    }

    setMapStatus("loading");
    loadGoogleMapsApi(APP_CONFIG.googleMapsApiKey)
      .then(async (google) => {
        const coordinates = await geocodeDestination(google, destination.query);
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const { map, marker } = createPostMap(
          google,
          mapContainerRef.current,
          coordinates,
          destination.displayLabel,
          darkModeRef.current,
        );
        destinationCoordinatesRef.current = coordinates;
        mapRef.current = map;
        markerRef.current = marker;
        setMapStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setMapStatus("error");
        }
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [destination, hasGoogleMapsSupport]);

  useEffect(() => {
    darkModeRef.current = darkMode;
    if (mapRef.current) {
      applyPostMapTheme(mapRef.current, darkMode);
    }
  }, [darkMode]);

  const openGoogleMaps = () => {
    if (!googleMapsUrl) {
      return;
    }
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  const createRouteRequest = useCallback(() => {
    if (!destination || !hasGoogleMapsSupport) {
      return null;
    }

    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;
    return {
      id: requestId,
      destinationQuery: destination.query,
    };
  }, [destination, hasGoogleMapsSupport]);

  const isRouteRequestCurrent = useCallback(
    (request: { id: number; destinationQuery: string }): boolean =>
      Boolean(
        destination &&
          routeRequestIdRef.current === request.id &&
          destination.query === request.destinationQuery,
      ),
    [destination],
  );

  const calculateRouteFromLocation = useCallback(
    async (
      location: Coordinates,
      shouldCacheLocation: boolean,
      routeRequest = createRouteRequest(),
    ) => {
      if (!destination || !hasGoogleMapsSupport) {
        setRouteStatus("error");
        setRouteError(labels.mapUnavailable);
        return false;
      }

      if (!routeRequest) {
        return false;
      }

      setRouteStatus("loading");
      setRouteError("");
      setRouteMetrics(null);

      try {
        const google = await loadGoogleMapsApi(APP_CONFIG.googleMapsApiKey);
        const destinationCoordinates =
          destinationCoordinatesRef.current ||
          (await geocodeDestination(google, routeRequest.destinationQuery));
        const metrics = await calculateDrivingRouteMetrics(
          google,
          location,
          destinationCoordinates,
        );

        if (!isRouteRequestCurrent(routeRequest)) {
          return false;
        }

        if (shouldCacheLocation) {
          cacheUserLocation(location);
        }
        setUserLocation(location);
        setRouteMetrics(metrics);
        setRouteStatus("success");
        return true;
      } catch (error) {
        if (!isRouteRequestCurrent(routeRequest)) {
          return false;
        }

        const message =
          error instanceof Error && error.message.includes("Geolocation")
            ? labels.locationUnavailable
            : labels.routeError;
        setRouteError(message);
        setRouteStatus("error");
        return false;
      }
    },
    [
      createRouteRequest,
      destination,
      hasGoogleMapsSupport,
      isRouteRequestCurrent,
      labels.locationUnavailable,
      labels.mapUnavailable,
      labels.routeError,
    ],
  );

  useEffect(() => {
    if (!destination || !hasGoogleMapsSupport || routeStatus !== "idle") {
      return;
    }

    void (async () => {
      const canUseCache = await canUseCachedUserLocation();
      if (!canUseCache) {
        clearCachedUserLocation();
        return;
      }

      if (routeStatus !== "idle") {
        return;
      }

      const cachedLocation = readCachedUserLocation();
      if (!cachedLocation) {
        return;
      }

      void calculateRouteFromLocation(cachedLocation, false);
    })();
  }, [
    calculateRouteFromLocation,
    destination,
    hasGoogleMapsSupport,
    routeStatus,
  ]);

  const handleUseLocation = async () => {
    if (!hasGoogleMapsSupport || !destination) {
      setRouteStatus("error");
      setRouteError(labels.mapUnavailable);
      return;
    }

    const routeRequest = createRouteRequest();
    if (!routeRequest) {
      return;
    }

    setRouteStatus("loading");
    setRouteError("");
    setRouteMetrics(null);

    try {
      const location = await getBrowserLocation();
      if (!isRouteRequestCurrent(routeRequest)) {
        return;
      }

      await calculateRouteFromLocation(location, true, routeRequest);
    } catch {
      if (!isRouteRequestCurrent(routeRequest)) {
        return;
      }

      setRouteError(labels.locationUnavailable);
      setRouteStatus("error");
    }
  };

  const renderRouteContent = () => {
    if (routeStatus === "success" && routeMetrics) {
      const distance = formatDistance(routeMetrics.distanceMeters, language);
      const duration = formatDuration(routeMetrics.durationSeconds, language);
      
      return (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Car className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{language === "ar" ? `${duration} بالسيارة` : `${duration} by car`}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{language === "ar" ? `يبعد ${distance}` : `About ${distance} away`}</span>
          </div>
        </div>
      );
    }

    const text = routeStatus === "loading"
      ? labels.loadingRoute
      : routeStatus === "error"
        ? routeError || labels.routeError
        : labels.prompt;

    return <span>{text}</span>;
  };

  if (!destination) {
    return null;
  }

  return (
    <Card
      className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-lg shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30"
      data-testid="post-location-map-card"
      data-map-theme={darkMode ? "dark" : "light"}
    >
      <CardContent className="p-2.5">
        <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner dark:border-white/10 dark:bg-slate-950">
          {hasGoogleMapsSupport && mapStatus !== "error" ? (
            <div
              ref={mapContainerRef}
              className="absolute inset-0"
            />
          ) : null}

          {(!hasGoogleMapsSupport || mapStatus !== "ready") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 p-5 text-center text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              {mapStatus === "loading" ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : !hasGoogleMapsSupport || mapStatus === "error" ? (
                <AlertCircle className="h-6 w-6 text-primary" />
              ) : null}
              <span className="text-sm font-semibold">
                {!hasGoogleMapsSupport || mapStatus === "error"
                  ? labels.mapUnavailable
                  : destination.displayLabel}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={openGoogleMaps}
            className="absolute top-2 inset-s-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-900"
            aria-label={`${labels.mapPreview}: ${destination.displayLabel}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.openMaps}
          </button>

          <div
            className={cn(
              "absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center w-[calc(100%-1.5rem)] sm:w-max min-w-[min(100%-1.5rem,20rem)] max-w-md rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 text-sm shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90",
              isRTL ? "text-right" : "text-left",
            )}
          >
            <div
              className={cn(
                "font-semibold w-full text-center",
                routeStatus === "error"
                  ? "text-destructive"
                  : "text-slate-800 dark:text-slate-100",
              )}
              aria-live="polite"
            >
              {renderRouteContent()}
            </div>
            {routeStatus !== "success" && hasGoogleMapsSupport && (
              <Button
                type="button"
                size="sm"
                className="mt-2.5 h-9 rounded-xl px-4 text-sm font-semibold w-full sm:w-auto"
                onClick={handleUseLocation}
                disabled={routeStatus === "loading"}
                aria-label={labels.useLocation}
              >
                {routeStatus === "loading" ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="me-2 h-4 w-4" />
                )}
                {labels.useLocation}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

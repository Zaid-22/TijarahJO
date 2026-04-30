import { TAILWIND_COLOR_PALETTE } from "../../shared/design/colorTokens";
import type { Coordinates, RouteMetrics } from "./postLocationMapUtils";

type MapStyleRule = {
  elementType?: string;
  featureType?: string;
  stylers: Array<{
    color?: string;
    lightness?: number;
    saturation?: number;
    visibility?: string;
  }>;
};

type MapOptions = {
  center: Coordinates;
  zoom: number;
  mapId?: string;
  disableDefaultUI?: boolean;
  clickableIcons?: boolean;
  gestureHandling?: string;
  styles?: MapStyleRule[] | null;
};

interface GoogleMap {
  setCenter(position: Coordinates): void;
  setOptions(options: Partial<MapOptions>): void;
}

interface GoogleMarker {
  setMap(map: GoogleMap | null): void;
}

type PostMapHandle = {
  map: GoogleMap;
  marker: GoogleMarker;
  supportsInlineStyles: boolean;
};

interface GoogleAdvancedMarker {
  map: GoogleMap | null;
}

type AdvancedMarkerConstructor = new (options: {
  position: Coordinates;
  map: GoogleMap;
  title?: string;
}) => GoogleAdvancedMarker;

type MarkerLibrary = {
  AdvancedMarkerElement?: AdvancedMarkerConstructor;
};

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GeocoderResult {
  geometry?: {
    location?: GoogleLatLng;
  };
}

interface Geocoder {
  geocode(
    request: { address: string },
    callback: (results: GeocoderResult[] | null, status: string) => void,
  ): void;
}

type RoutesLibrary = {
  Route?: {
    computeRoutes(request: {
      origin: Coordinates;
      destination: Coordinates;
      travelMode: string;
      fields: string[];
    }): Promise<{
      routes?: Array<{
        distanceMeters?: number;
        durationMillis?: number;
      }>;
    }>;
  };
};

interface GoogleMapsNamespace {
  maps: {
    Geocoder: new () => Geocoder;
    GeocoderStatus?: {
      OK: string;
    };
    Map: new (element: HTMLElement, options: MapOptions) => GoogleMap;
    Marker: new (options: {
      position: Coordinates;
      map: GoogleMap;
      title?: string;
    }) => GoogleMarker;
    marker?: {
      AdvancedMarkerElement?: AdvancedMarkerConstructor;
    };
    TravelMode: {
      DRIVING: string;
    };
    importLibrary?: (libraryName: string) => Promise<unknown>;
    routes?: RoutesLibrary;
  };
}

type GlobalWithGoogleMaps = typeof globalThis & {
  google?: GoogleMapsNamespace;
  __tijarahJoGoogleMapsPromise?: Promise<GoogleMapsNamespace>;
  __tijarahJoInitGoogleMaps?: () => void;
};

const DARK_MAP_STYLES: MapStyleRule[] = [
  {
    elementType: "geometry",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.slate["900"] }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.slate["200"] }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.slate["950"] }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.slate["800"] }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.slate["300"] }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: TAILWIND_COLOR_PALETTE.sky["950"] }],
  },
];

function getMapsGlobal(): GlobalWithGoogleMaps {
  return globalThis as GlobalWithGoogleMaps;
}

export function hasGoogleMapsGlobal(): boolean {
  return Boolean(getMapsGlobal().google?.maps);
}

async function importOptionalLibraries(maps: GoogleMapsNamespace["maps"]) {
  if (!maps.importLibrary) {
    return;
  }

  const [, markerResult] = await Promise.allSettled([
    maps.importLibrary("maps"),
    maps.importLibrary("marker"),
    maps.importLibrary("routes"),
    maps.importLibrary("geocoding"),
  ]);

  if (markerResult.status === "fulfilled") {
    const markerLibrary = markerResult.value as MarkerLibrary;
    if (markerLibrary.AdvancedMarkerElement) {
      maps.marker = {
        ...maps.marker,
        AdvancedMarkerElement: markerLibrary.AdvancedMarkerElement,
      };
    }
  }
}

export async function loadGoogleMapsApi(
  apiKey: string,
): Promise<GoogleMapsNamespace> {
  const mapsGlobal = getMapsGlobal();
  if (mapsGlobal.google?.maps) {
    await importOptionalLibraries(mapsGlobal.google.maps);
    return mapsGlobal.google;
  }

  if (typeof document === "undefined" || !apiKey) {
    throw new Error("Google Maps API key is not configured.");
  }

  if (mapsGlobal.__tijarahJoGoogleMapsPromise) {
    return mapsGlobal.__tijarahJoGoogleMapsPromise;
  }

  mapsGlobal.__tijarahJoGoogleMapsPromise = new Promise((resolve, reject) => {
    mapsGlobal.__tijarahJoInitGoogleMaps = () => {
      if (!mapsGlobal.google?.maps) {
        reject(new Error("Google Maps failed to initialize."));
        return;
      }

      importOptionalLibraries(mapsGlobal.google.maps)
        .then(() => resolve(mapsGlobal.google as GoogleMapsNamespace))
        .catch(() => resolve(mapsGlobal.google as GoogleMapsNamespace));
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      callback: "__tijarahJoInitGoogleMaps",
      libraries: "geocoding,marker,routes",
      loading: "async",
      v: "weekly",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      reject(new Error("Unable to load Google Maps."));
    };
    document.head.appendChild(script);
  });

  return mapsGlobal.__tijarahJoGoogleMapsPromise;
}

export async function geocodeDestination(
  maps: GoogleMapsNamespace,
  address: string,
): Promise<Coordinates> {
  const geocoder = new maps.maps.Geocoder();
  const okStatus = maps.maps.GeocoderStatus?.OK ?? "OK";

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      const location = results?.[0]?.geometry?.location;
      if (status !== okStatus || !location) {
        reject(new Error("Unable to resolve post location."));
        return;
      }

      resolve({
        lat: location.lat(),
        lng: location.lng(),
      });
    });
  });
}

export function createPostMap(
  maps: GoogleMapsNamespace,
  element: HTMLElement,
  destination: Coordinates,
  title: string,
  darkMode: boolean,
  mapId: string,
): PostMapHandle {
  const AdvancedMarkerElement = maps.maps.marker?.AdvancedMarkerElement;
  const canUseAdvancedMarker = Boolean(AdvancedMarkerElement && mapId);
  const supportsInlineStyles = !canUseAdvancedMarker;
  const map = new maps.maps.Map(element, {
    center: destination,
    zoom: 14,
    ...(canUseAdvancedMarker ? { mapId } : {}),
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: "none",
    ...(supportsInlineStyles
      ? { styles: darkMode ? DARK_MAP_STYLES : null }
      : {}),
  });
  if (canUseAdvancedMarker && AdvancedMarkerElement) {
    const advancedMarker = new AdvancedMarkerElement({
      position: destination,
      map,
      title,
    });

    return {
      map,
      supportsInlineStyles,
      marker: {
        setMap(nextMap: GoogleMap | null) {
          advancedMarker.map = nextMap;
        },
      },
    };
  }

  const marker = new maps.maps.Marker({
    position: destination,
    map,
    title,
  });

  return { map, marker, supportsInlineStyles };
}

export function applyPostMapTheme(map: GoogleMap, darkMode: boolean) {
  map.setOptions({
    styles: darkMode ? DARK_MAP_STYLES : null,
  });
}

export async function calculateDrivingRouteMetrics(
  maps: GoogleMapsNamespace,
  origin: Coordinates,
  destination: Coordinates,
): Promise<RouteMetrics> {
  const importedRoutes = maps.maps.importLibrary
    ? ((await maps.maps.importLibrary("routes")) as RoutesLibrary)
    : undefined;
  const routeApi = importedRoutes?.Route ?? maps.maps.routes?.Route;

  if (!routeApi) {
    throw new Error("Google Routes library is not available.");
  }

  const result = await routeApi.computeRoutes({
    origin,
    destination,
    travelMode: maps.maps.TravelMode.DRIVING,
    fields: ["distanceMeters", "durationMillis"],
  });
  const route = result.routes?.[0];
  const distanceMeters = route?.distanceMeters;
  const durationMillis = route?.durationMillis;

  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationMillis)) {
    throw new Error("Unable to calculate route.");
  }

  return {
    distanceMeters: Number(distanceMeters),
    durationSeconds: Math.max(1, Math.round(Number(durationMillis) / 1000)),
  };
}

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

  await Promise.allSettled([
    maps.importLibrary("maps"),
    maps.importLibrary("marker"),
    maps.importLibrary("routes"),
    maps.importLibrary("geocoding"),
  ]);
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
): { map: GoogleMap; marker: GoogleMarker } {
  const map = new maps.maps.Map(element, {
    center: destination,
    zoom: 14,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: "none",
    styles: darkMode ? DARK_MAP_STYLES : null,
  });
  const marker = new maps.maps.Marker({
    position: destination,
    map,
    title,
  });

  return { map, marker };
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

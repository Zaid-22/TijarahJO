import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type RawCity = {
  CityId?: unknown;
  cityId?: unknown;
  CityName?: unknown;
  cityName?: unknown;
  CityNameAr?: unknown;
  cityNameAr?: unknown;
};

type RawArea = {
  AreaId?: unknown;
  areaId?: unknown;
  AreaName?: unknown;
  areaName?: unknown;
  AreaNameAr?: unknown;
  areaNameAr?: unknown;
  CityId?: unknown;
  cityId?: unknown;
};

export type LocationCity = {
  cityId: number;
  cityName: string;
  cityNameAr: string;
};

export type LocationArea = {
  areaId: number;
  areaName: string;
  areaNameAr: string;
  cityId: number;
};

function normalizeCity(payload: RawCity | null | undefined): LocationCity | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const cityId = toPositiveIntegerId(payload.CityId ?? payload.cityId);
  const cityName = String(payload.CityName ?? payload.cityName ?? "").trim();
  const cityNameAr = String(payload.CityNameAr ?? payload.cityNameAr ?? "").trim();
  if (!cityId || !cityName) {
    return null;
  }

  return {
    cityId,
    cityName,
    cityNameAr,
  };
}

function normalizeArea(payload: RawArea | null | undefined): LocationArea | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const areaId = toPositiveIntegerId(payload.AreaId ?? payload.areaId);
  const cityId = toPositiveIntegerId(payload.CityId ?? payload.cityId);
  const areaName = String(payload.AreaName ?? payload.areaName ?? "").trim();
  const areaNameAr = String(payload.AreaNameAr ?? payload.areaNameAr ?? "").trim();
  if (!areaId || !cityId || !areaName) {
    return null;
  }

  return {
    areaId,
    cityId,
    areaName,
    areaNameAr,
  };
}

// In-flight deduplication — prevents concurrent duplicate requests to the locations endpoints
let _citiesInflight: Promise<LocationCity[]> | null = null;
const _areasInflight: Map<number, Promise<LocationArea[]>> = new Map();

export const locationsApi = {
  getCities: async (): Promise<LocationCity[]> => {
    // Deduplicate: if another caller is already fetching all cities, share the promise.
    if (_citiesInflight) {
      return _citiesInflight;
    }

    _citiesInflight = (async () => {
      const response = await apiRequest<RawCity[]>("/cities", {
        method: "GET",
      });
      if (!response.success || !Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .map((payload) => normalizeCity(payload))
        .filter((city): city is LocationCity => city !== null);
    })().finally(() => {
      _citiesInflight = null;
    });

    return _citiesInflight;
  },

  getAreasByCity: async (cityId: number): Promise<LocationArea[]> => {
    const normalizedCityId = toPositiveIntegerId(cityId);
    if (!normalizedCityId) {
      return [];
    }

    // Deduplicate: if another caller is already fetching areas for this city, share the promise.
    let inflight = _areasInflight.get(normalizedCityId);
    if (inflight) {
      return inflight;
    }

    inflight = (async () => {
      const response = await apiRequest<RawArea[]>(`/cities/${normalizedCityId}/areas`, {
        method: "GET",
      });
      if (!response.success || !Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .map((payload) => normalizeArea(payload))
        .filter((area): area is LocationArea => area !== null);
    })().finally(() => {
      _areasInflight.delete(normalizedCityId);
    });

    _areasInflight.set(normalizedCityId, inflight);
    return inflight;
  },
};

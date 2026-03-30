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

export const locationsApi = {
  getCities: async (): Promise<LocationCity[]> => {
    const response = await apiRequest<RawCity[]>("/cities", {
      method: "GET",
    });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map((payload) => normalizeCity(payload))
      .filter((city): city is LocationCity => city !== null);
  },

  getAreasByCity: async (cityId: number): Promise<LocationArea[]> => {
    const normalizedCityId = toPositiveIntegerId(cityId);
    if (!normalizedCityId) {
      return [];
    }

    const response = await apiRequest<RawArea[]>(`/cities/${normalizedCityId}/areas`, {
      method: "GET",
    });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map((payload) => normalizeArea(payload))
      .filter((area): area is LocationArea => area !== null);
  },
};

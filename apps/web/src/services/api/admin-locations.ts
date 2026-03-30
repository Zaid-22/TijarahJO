import { apiRequest, debugError } from "./client";
import { type AdminCityItem } from "./admin.types";
import { toCamelCaseKeys } from "./admin";

export const adminLocationsApi = {
  getCities: async (): Promise<AdminCityItem[]> => {
    try {
      const response = await apiRequest<AdminCityItem[]>(
        "/admin/locations/cities",
        { method: "GET" },
      );
      if (response.success && response.data) return toCamelCaseKeys<AdminCityItem[]>(response.data);
      throw new Error("Failed to fetch cities");
    } catch (error) {
      debugError("Failed to fetch cities:", error);
      throw error;
    }
  },

  createCity: async (name: string, nameAr: string): Promise<{ cityID: number }> => {
    const response = await apiRequest<{ cityID: number }>(
      "/admin/locations/cities",
      {
        method: "POST",
        body: JSON.stringify({ name, nameAr }),
      },
    );
    if (response.success && response.data) return response.data;
    throw new Error("Failed to create city");
  },

  updateCity: async (id: number, name: string, nameAr: string): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/cities/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, nameAr }),
    });
    return response.success;
  },

  deleteCity: async (id: number): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/cities/${id}`, {
      method: "DELETE",
    });
    return response.success;
  },

  createArea: async (
    cityID: number,
    name: string,
    nameAr: string,
  ): Promise<{ areaID: number }> => {
    const response = await apiRequest<{ areaID: number }>(
      "/admin/locations/areas",
      {
        method: "POST",
        body: JSON.stringify({ cityID, name, nameAr }),
      },
    );
    if (response.success && response.data) return response.data;
    throw new Error("Failed to create area");
  },

  updateArea: async (id: number, name: string, nameAr: string): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/areas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, nameAr }),
    });
    return response.success;
  },

  deleteArea: async (id: number): Promise<boolean> => {
    const response = await apiRequest(`/admin/locations/areas/${id}`, {
      method: "DELETE",
    });
    return response.success;
  },
};

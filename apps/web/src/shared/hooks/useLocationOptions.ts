import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { LocationArea, LocationCity } from "../../services/api/locations";
import { logger } from "../lib/logger";

function normalizeLocationName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function useLocationOptions(selectedCityName: string, language?: string) {
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [areas, setAreas] = useState<LocationArea[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  const isArabic = language === "ar";

  const normalizedSelectedCityName = normalizeLocationName(selectedCityName);

  const selectedCityId = useMemo(() => {
    if (!normalizedSelectedCityName) {
      return undefined;
    }

    // Match by either English or Arabic name
    return cities.find(
      (city) =>
        normalizeLocationName(city.cityName) === normalizedSelectedCityName ||
        normalizeLocationName(city.cityNameAr) === normalizedSelectedCityName,
    )?.cityId;
  }, [cities, normalizedSelectedCityName]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const fetchedCities = await api.locations.getCities();
        if (!cancelled) {
          setCities(fetchedCities);
        }
      } catch (error) {
        if (!cancelled) {
          logger.warn("[useLocationOptions] Failed to fetch cities", error);
          setCities([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCities(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedCityId) {
      setAreas([]);
      setIsLoadingAreas(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingAreas(true);
    (async () => {
      try {
        const fetchedAreas = await api.locations.getAreasByCity(selectedCityId);
        if (!cancelled) {
          setAreas(fetchedAreas);
        }
      } catch (error) {
        if (!cancelled) {
          logger.warn(
            `[useLocationOptions] Failed to fetch areas for city ${selectedCityId}`,
            error,
          );
          setAreas([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAreas(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  const cityNames = useMemo(
    () =>
      cities.map((city) =>
        isArabic && city.cityNameAr ? city.cityNameAr : city.cityName,
      ),
    [cities, isArabic],
  );

  const areaNames = useMemo(
    () =>
      areas.map((area) =>
        isArabic && area.areaNameAr ? area.areaNameAr : area.areaName,
      ),
    [areas, isArabic],
  );

  return {
    cities,
    cityNames,
    areas,
    areaNames,
    selectedCityId,
    isLoadingCities,
    isLoadingAreas,
  };
}

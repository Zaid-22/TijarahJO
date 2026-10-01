import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { STORAGE_KEYS } from "../../constants";
import type { Category } from "../../types/api";
import { logger } from "../lib/logger";

function byCategoryName(a: Category, b: Category): number {
  return a.name.localeCompare(b.name);
}

const CATALOG_CATEGORIES_STORAGE_KEY =
  STORAGE_KEYS.SETTINGS_PREFERENCES.replace("settings", "catalog-categories-v1");

function normalizeStoredCategories(value: unknown): Category[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized = value.filter((category): category is Category => {
    return (
      typeof category === "object" &&
      category !== null &&
      typeof category.id === "string" &&
      typeof category.name === "string" &&
      typeof category.nameAr === "string" &&
      typeof category.image === "string" &&
      typeof category.postCount === "number"
    );
  });

  return normalized.length > 0 ? normalized.sort(byCategoryName) : null;
}

function getInitialCatalogCategories(): Category[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CATALOG_CATEGORIES_STORAGE_KEY);
    if (stored) {
      const parsed = normalizeStoredCategories(JSON.parse(stored));
      if (parsed) {
        return parsed;
      }
    }
  } catch {
    // Fall back to baked-in categories if cache parsing fails.
  }

  return [];
}

function saveCatalogCategories(categories: Category[]) {
  if (typeof window === "undefined" || categories.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_CATEGORIES_STORAGE_KEY,
      JSON.stringify(categories),
    );
  } catch {
    // Ignore storage failures so the UI keeps working even in private mode.
  }
}

function clearCatalogCategories() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CATALOG_CATEGORIES_STORAGE_KEY);
  } catch {
    // Ignore storage failures so the UI keeps working even in private mode.
  }
}

type UseCatalogCategoriesOptions = {
  useInitialFallback?: boolean;
  enabled?: boolean;
};

export function useCatalogCategories(
  options: UseCatalogCategoriesOptions = {},
) {
  const { useInitialFallback = false, enabled = true } = options;
  const initialCategories =
    enabled && useInitialFallback ? getInitialCatalogCategories() : [];
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(
    enabled && initialCategories.length === 0,
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await api.categories.getCategories();
        if (cancelled) {
          return;
        }

        if (response.success) {
          const normalized = response.categories
            .filter((category) => category.name.trim().length > 0)
            .sort(byCategoryName);

          setCategories(normalized);

          if (normalized.length > 0) {
            saveCatalogCategories(normalized);
          } else {
            clearCatalogCategories();
          }

          return;
        }
      } catch (error) {
        if (!cancelled) {
          logger.warn("[useCatalogCategories] Failed to fetch categories", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { categories, isLoading };
}

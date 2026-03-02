import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { Category } from "../../types/api";
import { logger } from "../lib/logger";

function byCategoryName(a: Category, b: Category): number {
  return a.name.localeCompare(b.name);
}

export function useCatalogCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.categories.getCategories();
        if (cancelled) {
          return;
        }

        if (response.success && response.categories?.length > 0) {
          const normalized = response.categories
            .filter((category) => category.name.trim().length > 0)
            .sort(byCategoryName);
          setCategories(normalized);
          return;
        }

        setCategories([]);
      } catch (error) {
        if (!cancelled) {
          logger.warn("[useCatalogCategories] Failed to fetch categories", error);
          setCategories([]);
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
  }, []);

  return { categories, isLoading };
}

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { SearchFilters } from "../components/searchFilterTypes";

type SortBy = NonNullable<SearchFilters["sortBy"]>;
type SortOrder = NonNullable<SearchFilters["sortOrder"]>;

interface MarketplaceUrlStateOptions {
  defaultSortBy?: SortBy;
  defaultSortOrder?: SortOrder;
}

const VALID_SORT_FIELDS = new Set<SortBy>(["date", "price", "views"]);
const VALID_SORT_ORDERS = new Set<SortOrder>(["asc", "desc"]);

function readPositiveInteger(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readNonNegativeNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || String(value).trim() === "") {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}

export function useMarketplaceUrlState({
  defaultSortBy = "date",
  defaultSortOrder = "desc",
}: MarketplaceUrlStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q")?.trim() || "";
  const page = readPositiveInteger(searchParams.get("page"));
  const filters = useMemo<SearchFilters>(() => {
    const rawSortBy = searchParams.get("sortBy") as SortBy | null;
    const rawSortOrder = searchParams.get("sortOrder") as SortOrder | null;

    return {
      category: searchParams.get("category")?.trim() || undefined,
      city: searchParams.get("city")?.trim() || undefined,
      minPrice: readNonNegativeNumber(searchParams.get("minPrice")),
      maxPrice: readNonNegativeNumber(searchParams.get("maxPrice")),
      sortBy:
        rawSortBy && VALID_SORT_FIELDS.has(rawSortBy)
          ? rawSortBy
          : defaultSortBy,
      sortOrder:
        rawSortOrder && VALID_SORT_ORDERS.has(rawSortOrder)
          ? rawSortOrder
          : defaultSortOrder,
    };
  }, [defaultSortBy, defaultSortOrder, searchParams]);

  const updateParams = useCallback(
    (update: (nextParams: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams);
      update(nextParams);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateParams((nextParams) => {
        if (nextPage <= 1) {
          nextParams.delete("page");
        } else {
          nextParams.set("page", String(Math.trunc(nextPage)));
        }
      });
    },
    [updateParams],
  );

  const setQuery = useCallback(
    (nextQuery: string) => {
      updateParams((nextParams) => {
        setOptionalParam(nextParams, "q", nextQuery.trim());
        nextParams.delete("page");
      });
    },
    [updateParams],
  );

  const applyFilters = useCallback(
    (nextFilters: SearchFilters) => {
      updateParams((nextParams) => {
        setOptionalParam(nextParams, "category", nextFilters.category);
        setOptionalParam(nextParams, "city", nextFilters.city);
        setOptionalParam(nextParams, "minPrice", nextFilters.minPrice);
        setOptionalParam(nextParams, "maxPrice", nextFilters.maxPrice);

        if ((nextFilters.sortBy || defaultSortBy) === defaultSortBy) {
          nextParams.delete("sortBy");
        } else {
          nextParams.set("sortBy", nextFilters.sortBy || defaultSortBy);
        }

        if ((nextFilters.sortOrder || defaultSortOrder) === defaultSortOrder) {
          nextParams.delete("sortOrder");
        } else {
          nextParams.set(
            "sortOrder",
            nextFilters.sortOrder || defaultSortOrder,
          );
        }

        nextParams.delete("page");
      });
    },
    [defaultSortBy, defaultSortOrder, updateParams],
  );

  const clearFilters = useCallback(() => {
    applyFilters({
      sortBy: defaultSortBy,
      sortOrder: defaultSortOrder,
    });
  }, [applyFilters, defaultSortBy, defaultSortOrder]);

  return {
    query,
    page,
    filters,
    setPage,
    setQuery,
    applyFilters,
    clearFilters,
  };
}

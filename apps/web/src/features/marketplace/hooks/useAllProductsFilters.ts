import { useEffect, useState } from "react";
import { APP_CONFIG } from "../../../constants/appConfig";
import { isActiveProduct, rankProductsBySearch } from "../../../lib/searchRanking";
import { api } from "../../../services/api";
import { Product } from "../../../types";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { runSearchPipeline } from "../search/searchPipeline";

export type AllProductsSortBy = "recent" | "price-low" | "price-high" | "name";
export type AllProductsPriceRange =
  | "all"
  | "0-50"
  | "50-100"
  | "100-500"
  | "500+";
export type AllProductsViewMode = "grid-4" | "grid-3" | "grid-2" | "list";

type UseAllProductsFiltersArgs = {
  products: Product[];
};

function resolvePriceRange(
  priceRange: AllProductsPriceRange,
): { minPrice?: number; maxPrice?: number } {
  switch (priceRange) {
    case "0-50":
      return { maxPrice: 50 };
    case "50-100":
      return { minPrice: 50.01, maxPrice: 100 };
    case "100-500":
      return { minPrice: 100.01, maxPrice: 500 };
    case "500+":
      return { minPrice: 500.01 };
    default:
      return {};
  }
}

function resolveSort(
  sortBy: AllProductsSortBy,
): { sortBy: "date" | "price" | "views"; sortOrder: "asc" | "desc" } {
  if (sortBy === "price-low") {
    return { sortBy: "price", sortOrder: "asc" };
  }
  if (sortBy === "price-high") {
    return { sortBy: "price", sortOrder: "desc" };
  }

  return { sortBy: "date", sortOrder: "desc" };
}

function sortByUiMode(
  results: Product[],
  sortBy: AllProductsSortBy,
  query: string,
): Product[] {
  if (sortBy === "price-low") {
    return [...results].sort((a, b) => a.price - b.price);
  }
  if (sortBy === "price-high") {
    return [...results].sort((a, b) => b.price - a.price);
  }
  if (sortBy === "name") {
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (!query) {
    return [...results].sort((a, b) => {
      const timestampA = Date.parse(a.createdAt || "") || 0;
      const timestampB = Date.parse(b.createdAt || "") || 0;
      return timestampB - timestampA;
    });
  }
  return results;
}

export function useAllProductsFilters({ products }: UseAllProductsFiltersArgs) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<AllProductsSortBy>("recent");
  const [priceRange, setPriceRange] = useState<AllProductsPriceRange>("all");
  const [viewMode, setViewMode] = useState<AllProductsViewMode>("grid-4");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(() =>
    products.filter(isActiveProduct),
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setFilteredProducts(products.filter(isActiveProduct));
  }, [products]);

  useEffect(() => {
    let cancelled = false;
    const { minPrice, maxPrice } = resolvePriceRange(priceRange);
    const sortConfig = resolveSort(sortBy);
    const query = debouncedSearchQuery.trim();

    const applyLocalFallback = (): Product[] => {
      let results = products.filter(isActiveProduct);
      if (query) {
        results = rankProductsBySearch(results, query);
      }
      if (typeof minPrice === "number") {
        results = results.filter((product) => product.price >= minPrice);
      }
      if (typeof maxPrice === "number") {
        results = results.filter((product) => product.price <= maxPrice);
      }
      return sortByUiMode(results, sortBy, query);
    };

    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      const { products: nextProducts, error } = await runSearchPipeline({
        request: () =>
          api.search.search({
            query: query || undefined,
            minPrice,
            maxPrice,
            status: "ACTIVE",
            sortBy: sortConfig.sortBy,
            sortOrder: sortConfig.sortOrder,
            page: 1,
            limit: APP_CONFIG.search.allProductsLimit,
          }),
        buildFallbackProducts: applyLocalFallback,
        fallbackErrorMessage: "Failed to fetch products",
        transformRemoteProducts: (remoteProducts) => {
          let results = remoteProducts.filter(isActiveProduct);
          if (query && sortBy === "recent") {
            results = rankProductsBySearch(results, query);
          }
          return sortByUiMode(results, sortBy, query);
        },
      });

      if (cancelled) {
        return;
      }

      setFilteredProducts(nextProducts);
      setSearchError(error);
      setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, priceRange, products, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    filteredProducts,
    isSearching,
    searchError,
  };
}

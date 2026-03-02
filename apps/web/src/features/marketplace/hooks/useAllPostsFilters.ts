import { useCallback, useMemo, useState } from "react";
import { Language, Post } from "../../../types";
import {
  rankMarketplacePosts,
} from "../search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { sortAllPostsResults } from "../../../shared/lib/postSorting";
import type {
  AllPostsPriceRange,
  AllPostsSortBy,
} from "../../../shared/lib/marketplaceControls";

type UseAllPostsFiltersArgs = {
  posts: Post[];
  language: Language;
  searchQuery: string;
};

function resolvePriceRange(
  priceRange: AllPostsPriceRange,
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
  sortBy: AllPostsSortBy,
): { sortBy: "date" | "price" | "views"; sortOrder: "asc" | "desc" } {
  if (sortBy === "price-low") {
    return { sortBy: "price", sortOrder: "asc" };
  }
  if (sortBy === "price-high") {
    return { sortBy: "price", sortOrder: "desc" };
  }

  return { sortBy: "date", sortOrder: "desc" };
}

export function useAllPostsFilters({
  posts,
  language,
  searchQuery,
}: UseAllPostsFiltersArgs) {
  const [sortBy, setSortBy] = useState<AllPostsSortBy>("recent");
  const [priceRange, setPriceRange] = useState<AllPostsPriceRange>("all");
  const [showFilters, setShowFilters] = useState(false);
  const { minPrice, maxPrice } = useMemo(
    () => resolvePriceRange(priceRange),
    [priceRange],
  );
  const sortConfig = useMemo(() => resolveSort(sortBy), [sortBy]);
  const buildFallbackPosts = useCallback(
    ({
      activePosts,
      query,
    }: {
      activePosts: Post[];
      query: string;
    }) => {
      let results = activePosts;
      if (query) {
        results = rankMarketplacePosts(results, query);
      }
      if (typeof minPrice === "number") {
        results = results.filter((post) => post.price >= minPrice);
      }
      if (typeof maxPrice === "number") {
        results = results.filter((post) => post.price <= maxPrice);
      }
      return sortAllPostsResults(results, sortBy, language, query);
    },
    [language, maxPrice, minPrice, sortBy],
  );
  const transformRemotePosts = useCallback(
    (remotePosts: Post[], query: string) => {
      let results = remotePosts;
      if (query && sortBy === "recent") {
        results = rankMarketplacePosts(results, query);
      }
      return sortAllPostsResults(results, sortBy, language, query);
    },
    [language, sortBy],
  );
  const {
    posts: filteredPosts,
    error: searchError,
    isSearching,
  } = useMarketplaceSearchResults({
    preset: "all-posts",
    query: searchQuery,
    sourcePosts: posts,
    page: 1,
    minPrice,
    maxPrice,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
    shouldRequestWhenQueryEmpty: true,
    fallbackErrorMessage: "Failed to fetch posts",
    buildFallbackPosts,
    transformRemotePosts,
  });

  return {
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    showFilters,
    setShowFilters,
    filteredPosts,
    isSearching,
    searchError,
  };
}

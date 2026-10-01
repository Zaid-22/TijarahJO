import {
  isActivePost,
  rankPostsBySearch,
} from "../../../lib/searchRanking";
import type { Post } from "../../../types";
import type { SearchFilters } from "../components/searchFilterTypes";

interface FilterAndSortMarketplacePostsOptions {
  query?: string;
  matchesCategory?: (categoryName: string) => boolean;
  applySelectedCategory?: boolean;
}

export function rankMarketplacePosts(posts: Post[], query: string): Post[] {
  return rankPostsBySearch(posts.filter(isActivePost), query);
}

export function filterAndSortMarketplacePosts(
  posts: Post[],
  filters: SearchFilters,
  {
    query = "",
    matchesCategory,
    applySelectedCategory = true,
  }: FilterAndSortMarketplacePostsOptions = {},
): Post[] {
  let results = [...posts];

  if (matchesCategory) {
    results = results.filter((post) => matchesCategory(post.category));
  }

  if (applySelectedCategory && filters.category) {
    const categoryFilter = filters.category.toLowerCase();
    results = results.filter(
      (post) => post.category?.toLowerCase() === categoryFilter,
    );
  }

  if (filters.city) {
    const cityFilter = filters.city.toLowerCase();
    results = results.filter(
      (post) =>
        post.location?.toLowerCase().includes(cityFilter) ||
        post.locationAr?.toLowerCase().includes(cityFilter),
    );
  }

  const minimumPrice = filters.minPrice;
  if (minimumPrice != null) {
    results = results.filter((post) => post.price >= minimumPrice);
  }

  const maximumPrice = filters.maxPrice;
  if (maximumPrice != null) {
    results = results.filter((post) => post.price <= maximumPrice);
  }

  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    results = rankMarketplacePosts(results, normalizedQuery);
  }

  const order = filters.sortOrder === "asc" ? 1 : -1;
  return [...results].sort((a, b) => {
    if (filters.sortBy === "price") {
      return (a.price - b.price) * order;
    }
    if (filters.sortBy === "views") {
      return ((a.views ?? 0) - (b.views ?? 0)) * order;
    }

    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (dateA - dateB) * order;
  });
}

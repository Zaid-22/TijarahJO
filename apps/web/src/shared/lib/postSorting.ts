import type { Language, Post } from "../../types";

export type PostSortMode =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "most-viewed"
  | "name-az"
  | "name-za";

export type AllPostsUiSort = "recent" | "price-low" | "price-high" | "name";

function parseTimestamp(value: string | undefined): number {
  return Date.parse(value || "") || 0;
}

export function sortMarketplacePosts(
  posts: readonly Post[],
  sortMode: PostSortMode,
  language: Language,
): Post[] {
  const sorted = [...posts];

  switch (sortMode) {
    case "newest":
      sorted.sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));
      return sorted;
    case "oldest":
      sorted.sort((a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt));
      return sorted;
    case "price-low":
      sorted.sort((a, b) => a.price - b.price);
      return sorted;
    case "price-high":
      sorted.sort((a, b) => b.price - a.price);
      return sorted;
    case "most-viewed":
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      return sorted;
    case "name-az":
      sorted.sort((a, b) => a.name.localeCompare(b.name, language === "ar" ? "ar" : "en"));
      return sorted;
    case "name-za":
      sorted.sort((a, b) => b.name.localeCompare(a.name, language === "ar" ? "ar" : "en"));
      return sorted;
    default:
      return sorted;
  }
}

export function sortAllPostsResults(
  posts: readonly Post[],
  sortBy: AllPostsUiSort,
  language: Language,
  query: string,
): Post[] {
  if (sortBy === "recent") {
    if (query.trim().length > 0) {
      return [...posts];
    }

    return sortMarketplacePosts(posts, "newest", language);
  }

  if (sortBy === "price-low") {
    return sortMarketplacePosts(posts, "price-low", language);
  }

  if (sortBy === "price-high") {
    return sortMarketplacePosts(posts, "price-high", language);
  }

  return sortMarketplacePosts(posts, "name-az", language);
}

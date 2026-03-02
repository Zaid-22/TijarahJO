import type { Language } from "../../types";
import { translations } from "../../translations";
import type { PostSortMode } from "./postSorting";

export type AllPostsSortBy = "recent" | "price-low" | "price-high" | "name";
export type AllPostsPriceRange = "all" | "0-50" | "50-100" | "100-500" | "500+";

interface SelectOption<Value extends string> {
  value: Value;
  label: string;
}

const CATEGORY_SORT_LABELS: Record<
  PostSortMode,
  { en: string; ar: string }
> = {
  newest: { en: "Newest", ar: "الأحدث" },
  oldest: { en: "Oldest", ar: "الأقدم" },
  "price-low": { en: "Price: Low to High", ar: "السعر: من الأقل للأعلى" },
  "price-high": { en: "Price: High to Low", ar: "السعر: من الأعلى للأقل" },
  "most-viewed": { en: "Most Viewed", ar: "الأكثر مشاهدة" },
  "name-az": { en: "Name: A-Z", ar: "الاسم: أ-ي" },
  "name-za": { en: "Name: Z-A", ar: "الاسم: ي-أ" },
};

const ALL_POSTS_SORT_ORDER: AllPostsSortBy[] = [
  "recent",
  "price-low",
  "price-high",
  "name",
];

const CATEGORY_SORT_ORDER: PostSortMode[] = [
  "newest",
  "oldest",
  "price-low",
  "price-high",
  "most-viewed",
  "name-az",
  "name-za",
];

const ALL_POSTS_PRICE_OPTIONS: SelectOption<Exclude<AllPostsPriceRange, "all">>[] = [
  { value: "0-50", label: "0 - 50 JOD" },
  { value: "50-100", label: "50 - 100 JOD" },
  { value: "100-500", label: "100 - 500 JOD" },
  { value: "500+", label: "500+ JOD" },
];

export function getAllPostsPriceRangeOptions(
  language: Language,
): SelectOption<AllPostsPriceRange>[] {
  const t = translations[language];
  return [
    { value: "all", label: t.allPrices },
    ...ALL_POSTS_PRICE_OPTIONS,
  ];
}

export function getAllPostsSortOptions(
  language: Language,
): SelectOption<AllPostsSortBy>[] {
  const t = translations[language];
  const sortLabels: Record<AllPostsSortBy, string> = {
    recent: t.mostRecent,
    "price-low": t.priceLowToHigh,
    "price-high": t.priceHighToLow,
    name: t.nameAZ,
  };

  return ALL_POSTS_SORT_ORDER.map((sortKey) => ({
    value: sortKey,
    label: sortLabels[sortKey],
  }));
}

export function getCategorySortOptions(
  language: Language,
): SelectOption<PostSortMode>[] {
  return CATEGORY_SORT_ORDER.map((sortKey) => ({
    value: sortKey,
    label: CATEGORY_SORT_LABELS[sortKey][language],
  }));
}

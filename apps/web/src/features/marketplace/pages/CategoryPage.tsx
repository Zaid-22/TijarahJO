import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";
import { PageShell } from "../../../shared/ui/page-shell";

import { Language } from "../../../translations";
import { Post } from "../../../types";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import {
  resolveCategoryName,
} from "../../../shared/lib/categoryVisuals";
import {
  AdvancedSearchFilters,
  type SearchFilters,
} from "../components/AdvancedSearchFilters";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";

interface CategoryPageProps {
  categoryName: string;
  onBack: () => void;
  posts: Post[];
  onPostClick: (postId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  language: Language;
  currentUserId?: string;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  onRequireAuth?: () => void;
}

const CATEGORY_STOP_WORDS = new Set(["and"]);

const toCategoryMatchKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const categoryMatchesRequest = (category: string, request: string): boolean => {
  const categoryKey = toCategoryMatchKey(category);
  const requestKey = toCategoryMatchKey(request);

  if (!categoryKey || !requestKey) {
    return false;
  }
  if (categoryKey === requestKey) {
    return true;
  }

  const categoryTokens = new Set(categoryKey.split(" "));
  const requestedTokens = requestKey
    .split(" ")
    .filter((token) => token.length > 2 && !CATEGORY_STOP_WORDS.has(token));

  return (
    requestedTokens.length > 0 &&
    requestedTokens.every((token) => categoryTokens.has(token))
  );
};

export function CategoryPage({
  categoryName,
  onBack,
  posts,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  currentUserId,
  isAuthenticated = false,
  isLoading = false,
  onRequireAuth,
}: CategoryPageProps) {
  const { categories } = useCatalogCategories();

  const [appliedSearchFilters, setAppliedSearchFilters] = useState<SearchFilters>(
    { sortBy: "views", sortOrder: "desc" },
  );

  const currentCategory = categories.find(
    (category) => categoryMatchesRequest(category.name, categoryName),
  );
  const resolvedCategoryName = currentCategory?.name || categoryName;
  const displayCategoryName = currentCategory
    ? resolveCategoryName(currentCategory, language)
    : categoryName;

  const filteredPosts = useMemo(() => {
    const categoryPosts = posts.filter(
      (p) =>
        categoryMatchesRequest(p.category, resolvedCategoryName) &&
        p.status !== "SOLD" &&
        p.status !== "DELETED",
    );
    return categoryPosts;
  }, [posts, resolvedCategoryName]);

  const sortedPosts = useMemo(() => {
    let results = [...filteredPosts];

    if (appliedSearchFilters.city) {
      results = results.filter((p) =>
        p.location?.toLowerCase().includes(
          appliedSearchFilters.city!.toLowerCase(),
        ),
      );
    }
    if (appliedSearchFilters.minPrice != null) {
      results = results.filter((p) => p.price >= appliedSearchFilters.minPrice!);
    }
    if (appliedSearchFilters.maxPrice != null) {
      results = results.filter((p) => p.price <= appliedSearchFilters.maxPrice!);
    }
      if (appliedSearchFilters.sortBy) {
        const order = appliedSearchFilters.sortOrder === "asc" ? 1 : -1;
        results = [...results].sort((a, b) => {
          if (appliedSearchFilters.sortBy === "price") {
            return (a.price - b.price) * order;
          }
          if (appliedSearchFilters.sortBy === "views") {
            return ((a.views ?? 0) - (b.views ?? 0)) * order;
          }
          // date
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dateA - dateB) * order;
        });
      }
      return results;
  }, [filteredPosts, appliedSearchFilters]);

  const {
    viewMode,
    displayedResults: displayedPosts,
    shouldShowPagination,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: sortedPosts,
    itemsPerPage: 12,
    defaultViewMode: "list",
    storageKey: "tijarahjo_view_mode_category",
  });
  const resultsSummary =
    language === "ar"
      ? `${sortedPosts.length} ${sortedPosts.length === 1 ? "نتيجة" : "نتائج"}`
      : `${sortedPosts.length} ${sortedPosts.length === 1 ? "result" : "results"}`;

  return (
    <PageShell>
      {/* Category Header Section */}
      <div className="mx-auto w-full max-w-[94rem] px-4 pt-6 sm:px-6 lg:px-8 xl:px-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ar" ? "العودة" : "Back to Marketplace"}
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {displayCategoryName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {language === "ar"
            ? `تصفح جميع الإعلانات في قسم ${displayCategoryName}`
            : `Browse all available items in the ${categoryName.toLowerCase()} category`}
        </p>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[94rem] px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-7 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdvancedSearchFilters
                language={language}
                filters={{ ...appliedSearchFilters, category: displayCategoryName }}
                onFiltersChange={setAppliedSearchFilters}
                onApply={() => {}}
                onClear={() => {
                  setAppliedSearchFilters({ sortBy: "views", sortOrder: "desc" });
                }}
                showApplyButton={false}
              />
            </div>
          </aside>

          {/* Main Results Area */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                {language === "ar" ? "الإعلانات المتاحة" : "Available Listings"}
              </h2>
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100/80 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                {resultsSummary}
              </span>
            </div>

            {/* Controls Bar */}
            <MarketplaceDiscoveryControls
              language={language}
              className="mb-5"
              toolbarClassName="flex-none"
              leftSlotClassName="gap-2 flex-1 sm:flex-initial"
            />

            {isLoading ? (
              <div className="py-2.5">
                <PostResultsGridSkeleton
                  viewMode={viewMode}
                  count={12}
                  hideCategoryBadge
                />
              </div>
            ) : (
              <PostResultsGrid
                posts={displayedPosts}
                viewMode={viewMode}
                onPostClick={onPostClick}
                favoriteIds={favoriteIds}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                language={language}
                emptyState={{
                  title: language === "ar" ? "لا توجد نتائج" : "No results found",
                  description:
                    language === "ar"
                      ? "لا توجد منشورات متاحة في هذه الفئة"
                      : "No posts available in this category",
                }}
                onRequireAuth={onRequireAuth}
              />
            )}

            {shouldShowPagination ? (
              <MarketplaceResultsPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                isLoading={pagination.isLoading}
                language={language}
                onPrevious={pagination.onPrevious}
                onNext={pagination.onNext}
                className="mt-12 mb-8"
                showLoadingIndicator
              />
            ) : null}
          </div>
        </div>
      </main>
    </PageShell>
  );
}

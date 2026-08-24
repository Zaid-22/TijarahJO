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
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { useMarketplaceUrlState } from "../search/useMarketplaceUrlState";
import { useMarketplacePaginationNavigation } from "../search/useMarketplacePaginationNavigation";

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
  const {
    page,
    filters: appliedSearchFilters,
    setPage,
    applyFilters: setAppliedSearchFilters,
    clearFilters,
  } = useMarketplaceUrlState({
    defaultSortBy: "views",
    defaultSortOrder: "desc",
  });
  const [draftSearchFilters, setDraftSearchFilters] =
    useState<SearchFilters>(appliedSearchFilters);
  const [showFilters, setShowFilters] = useState(false);
  const { navigateToPage, resultsHeadingRef } =
    useMarketplacePaginationNavigation(setPage);

  useEffect(() => {
    setDraftSearchFilters(appliedSearchFilters);
  }, [appliedSearchFilters]);

  const currentCategory = categories.find(
    (category) => categoryMatchesRequest(category.name, categoryName),
  );
  const resolvedCategoryName = currentCategory?.name || categoryName;
  const displayCategoryName = currentCategory
    ? resolveCategoryName(currentCategory, language)
    : categoryName;

  const buildFallbackPosts = useCallback(
    ({ activePosts }: { activePosts: Post[] }) => {
      let results = activePosts.filter((post) =>
        categoryMatchesRequest(post.category, resolvedCategoryName),
      );

      if (appliedSearchFilters.city) {
        const cityFilter = appliedSearchFilters.city.toLowerCase();
        results = results.filter(
          (post) =>
            post.location?.toLowerCase().includes(cityFilter) ||
            post.locationAr?.toLowerCase().includes(cityFilter),
        );
      }
      if (appliedSearchFilters.minPrice != null) {
        results = results.filter(
          (post) => post.price >= (appliedSearchFilters.minPrice ?? 0),
        );
      }
      if (appliedSearchFilters.maxPrice != null) {
        results = results.filter(
          (post) => post.price <= (appliedSearchFilters.maxPrice ?? Infinity),
        );
      }

      const order = appliedSearchFilters.sortOrder === "asc" ? 1 : -1;
      return [...results].sort((a, b) => {
        if (appliedSearchFilters.sortBy === "price") {
          return (a.price - b.price) * order;
        }
        if (appliedSearchFilters.sortBy === "views") {
          return ((a.views ?? 0) - (b.views ?? 0)) * order;
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (dateA - dateB) * order;
      });
    },
    [appliedSearchFilters, resolvedCategoryName],
  );

  const {
    posts: displayedPosts,
    error: searchError,
    isSearching,
    pagination,
    refetch,
  } = useMarketplaceSearchResults({
    preset: "all-posts",
    query: "",
    sourcePosts: posts,
    page,
    limit: 12,
    category: resolvedCategoryName,
    city: appliedSearchFilters.city,
    minPrice: appliedSearchFilters.minPrice,
    maxPrice: appliedSearchFilters.maxPrice,
    sortBy: appliedSearchFilters.sortBy,
    sortOrder: appliedSearchFilters.sortOrder,
    shouldRequestWhenQueryEmpty: true,
    debounceMs: 0,
    fallbackErrorMessage:
      language === "ar"
        ? "تعذر تحميل إعلانات الفئة"
        : "Failed to load category listings",
    buildFallbackPosts,
  });

  useEffect(() => {
    if (!isSearching && !searchError && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [isSearching, page, pagination.totalPages, searchError, setPage]);

  const showLoading =
    displayedPosts.length === 0 &&
    (isSearching || (isLoading && posts.length === 0));

  return (
    <PageShell>
      {/* Category Header Section */}
      <div className="mx-auto w-full max-w-376 px-4 pt-6 sm:px-6 lg:px-8 xl:px-10">
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
      <div className="mx-auto w-full max-w-376 px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-6">
          {/* Top Filters (Desktop) */}
          <div className="hidden lg:block">
            <AdvancedSearchFilters
              language={language}
              filters={appliedSearchFilters}
              onFiltersChange={setAppliedSearchFilters}
              onApply={() => {}}
              onClear={clearFilters}
              showApplyButton={false}
            />
          </div>


          {/* Main Results Area */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <h2
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="scroll-mt-24 text-2xl font-bold tracking-tight text-foreground focus:outline-none"
              >
                {language === "ar" ? "الإعلانات المتاحة" : "Available Listings"}
              </h2>

            </div>

            {/* Controls Bar */}
            <MarketplaceDiscoveryControls
              language={language}
              className="mb-5 lg:hidden"
              toolbarClassName="flex-none"
              leftSlotClassName="gap-2 flex-1 sm:flex-initial"
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: language === "ar" ? "الفلاتر" : "Filters",
                content: (
                  <AdvancedSearchFilters
                    language={language}
                    filters={draftSearchFilters}
                    onFiltersChange={setDraftSearchFilters}
                    onApply={() => {
                      setAppliedSearchFilters(draftSearchFilters);
                      setShowFilters(false);
                    }}
                    onClear={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                  />
                ),
                onToggle: () => setShowFilters(!showFilters),
              }}
            />

            <MarketplaceQueryStatus
              isLoading={isSearching}
              error={searchError}
              loadingLabel={
                language === "ar" ? "جارٍ تحميل الإعلانات..." : "Loading listings..."
              }
              retryLabel={language === "ar" ? "إعادة المحاولة" : "Retry"}
              onRetry={() => {
                void refetch();
              }}
            />

            {showLoading ? (
              <div className="py-2.5">
                <PostResultsGridSkeleton
                  viewMode="list"
                  count={12}
                  hideCategoryBadge
                />
              </div>
            ) : searchError ? null : (
              <PostResultsGrid
                posts={displayedPosts}
                viewMode="list"
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

            {!searchError && pagination.totalPages > 1 ? (
              <MarketplaceResultsPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                isLoading={isSearching}
                language={language}
                onPrevious={() => navigateToPage(Math.max(1, page - 1))}
                onNext={() =>
                  navigateToPage(Math.min(pagination.totalPages, page + 1))
                }
                className="mt-12 mb-8"
                showLoadingIndicator
              />
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

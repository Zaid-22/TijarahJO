import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import {
  AdvancedSearchFilters,
} from "../components/AdvancedSearchFilters";
import { ArrowLeft } from "lucide-react";

import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";

import { Language } from "../../../translations";
import { Post } from "../../../types";
import { useCallback } from "react";
import {
  filterAndSortMarketplacePosts,
  rankMarketplacePosts,
} from "../search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import {
  useMarketplacePageBounds,
  useMarketplaceResultsPageState,
} from "../search/useMarketplaceResultsPageState";

interface SearchResultsPageProps {
  searchQuery: string;
  posts: Post[];
  onBack: () => void;
  onPostClick: (id: string) => void;
  language: Language;
  favoriteIds: string[];
  onFavoriteToggle: (id: string) => void;
  onSearch: (query: string) => void;
  isAuthenticated?: boolean;
  currentUserId?: string;
  onRequireAuth?: () => void;
}

export function SearchResultsPage({
  searchQuery: initialSearchQuery,
  posts,
  onBack,
  onPostClick,
  language,
  favoriteIds,
  onFavoriteToggle,
  onSearch,
  isAuthenticated = false,
  currentUserId,
  onRequireAuth,
}: SearchResultsPageProps) {
  const {
    query: queryFromUrl,
    page,
    filters: appliedSearchFilters,
    setPage,
    setQuery,
    applyFilters: setAppliedSearchFilters,
    clearFilters,
    draftFilters: draftSearchFilters,
    setDraftFilters: setDraftSearchFilters,
    showFilters,
    applyDraftFilters,
    clearMobileFilters,
    toggleFilters,
    navigateToPage,
    resultsHeadingRef,
  } = useMarketplaceResultsPageState({
    defaultSortBy: "views",
    defaultSortOrder: "desc",
  });
  const normalizedSearchQuery = (queryFromUrl || initialSearchQuery).trim();
  const clearSearch = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch, setQuery]);

  const buildFallbackPosts = useCallback(
    ({ activePosts, query }: { activePosts: Post[]; query: string }) => {
      if (!query) {
        return [];
      }

      return filterAndSortMarketplacePosts(activePosts, appliedSearchFilters, {
        query,
      });
    },
    [appliedSearchFilters],
  );

  const transformRemotePosts = useCallback(
    (remotePosts: Post[], query: string) =>
      rankMarketplacePosts(remotePosts, query),
    [],
  );
  const {
    posts: searchPosts,
    isSearching,
    error: searchError,
    pagination,
    refetch,
  } = useMarketplaceSearchResults({
    preset: "search-results",
    query: normalizedSearchQuery,
    sourcePosts: posts,
    page,
    limit: 12,
    category: appliedSearchFilters.category,
    city: appliedSearchFilters.city,
    sortBy: appliedSearchFilters.sortBy || "date",
    sortOrder: appliedSearchFilters.sortOrder || "desc",
    minPrice: appliedSearchFilters.minPrice,
    maxPrice: appliedSearchFilters.maxPrice,
    fallbackErrorMessage:
      language === "ar" ? "تعذر إكمال البحث" : "Search failed",
    buildFallbackPosts,
    transformRemotePosts,
  });

  useMarketplacePageBounds({
    isLoading: isSearching,
    error: searchError,
    page,
    totalPages: pagination.totalPages,
    setPage,
  });

  return (
    <PageShell>
      {/* Main Content */}
      <div className="mx-auto w-full max-w-376 px-4 pt-6 pb-8 sm:px-6 lg:px-8 xl:px-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ar" ? "العودة" : "Back"}
        </button>
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
              showCategory
            />
          </div>

          {/* Main Results Area */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <h1
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="scroll-mt-24 text-2xl font-bold tracking-tight text-foreground focus:outline-none"
              >
                {language === "ar" ? "نتائج البحث" : "Search Results"}
              </h1>
            </div>
            <MarketplaceQueryStatus
              isLoading={isSearching}
              error={searchError}
              loadingLabel={
                language === "ar" ? "جاري البحث..." : "Searching..."
              }
              retryLabel={language === "ar" ? "إعادة المحاولة" : "Retry"}
              onRetry={() => {
                void refetch();
              }}
            />

            <MarketplaceDiscoveryControls
              language={language}
              toolbarClassName="flex-none"
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: language === "ar" ? "الفلاتر" : "Filters",
                content: (
                  <AdvancedSearchFilters
                    language={language}
                    filters={draftSearchFilters}
                    onFiltersChange={setDraftSearchFilters}
                    onApply={applyDraftFilters}
                    onClear={clearMobileFilters}
                    showCategory
                  />
                ),
                onToggle: toggleFilters,
              }}
            />

            {isSearching ? (
              <div className="py-2.5">
                <PostResultsGridSkeleton viewMode="list" count={8} />
              </div>
            ) : searchError ? null : (
              <PostResultsGrid
                posts={searchPosts}
                viewMode="list"
                onPostClick={onPostClick}
                favoriteIds={favoriteIds}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                language={language}
                animated
                emptyState={{
                  title:
                    language === "ar" ? "لا توجد نتائج" : "No results found",
                  description:
                    language === "ar"
                      ? `لم نتمكن من العثور على أي منشورات تطابق "${normalizedSearchQuery}"`
                      : `We couldn't find any posts matching "${normalizedSearchQuery}"`,
                  actionLabel:
                    language === "ar"
                      ? "العودة إلى السوق"
                      : "Back to Marketplace",
                  onAction: () => {
                    clearSearch();
                    onBack();
                  },
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

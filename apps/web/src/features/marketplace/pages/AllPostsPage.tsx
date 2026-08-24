import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";
import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import { useCallback, useEffect, useState } from "react";
import { AdvancedSearchFilters, type SearchFilters } from "../components/AdvancedSearchFilters";
import { ArrowLeft } from "lucide-react";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { useMarketplaceUrlState } from "../search/useMarketplaceUrlState";
import { useMarketplacePaginationNavigation } from "../search/useMarketplacePaginationNavigation";

interface AllPostsPageProps {
  onBack: () => void;
  posts: Post[];
  onPostClick: (postId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  language: Language;
  isAuthenticated?: boolean;
  darkMode?: boolean;
  currentUserId?: string;
  onRequireAuth?: () => void;
}

export function AllPostsPage({
  onBack,
  posts,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  isAuthenticated = false,
  currentUserId,
  onRequireAuth,
}: AllPostsPageProps) {
  const t = translations[language];
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

  const buildFallbackPosts = useCallback(
    ({ activePosts }: { activePosts: Post[] }) => {
      let results = [...activePosts];

      if (appliedSearchFilters.category) {
        results = results.filter(
          (post) =>
            post.category?.toLowerCase() ===
            appliedSearchFilters.category?.toLowerCase(),
        );
      }
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
      results.sort((a, b) => {
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

      return results;
    },
    [appliedSearchFilters],
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
    category: appliedSearchFilters.category,
    city: appliedSearchFilters.city,
    minPrice: appliedSearchFilters.minPrice,
    maxPrice: appliedSearchFilters.maxPrice,
    sortBy: appliedSearchFilters.sortBy,
    sortOrder: appliedSearchFilters.sortOrder,
    shouldRequestWhenQueryEmpty: true,
    debounceMs: 0,
    fallbackErrorMessage:
      language === "ar" ? "تعذر تحميل الإعلانات" : "Failed to load listings",
    buildFallbackPosts,
  });

  useEffect(() => {
    if (!isSearching && !searchError && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [isSearching, page, pagination.totalPages, searchError, setPage]);

  return (
    <PageShell>
      {/* Unified Header Section */}
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
          {language === "ar" ? "جميع المنشورات" : "All Posts"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {language === "ar"
            ? "تصفح جميع الإعلانات المتاحة في السوق"
            : "Browse all available listings in the marketplace"}
        </p>
      </div>

      <div className="mx-auto w-full max-w-376 px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-6">
          <div className="hidden lg:block">
            <AdvancedSearchFilters
              language={language}
              filters={appliedSearchFilters}
              onFiltersChange={setAppliedSearchFilters}
              onApply={() => {}}
              onClear={clearFilters}
              showCategory
              showApplyButton={false}
            />
          </div>


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

            <MarketplaceDiscoveryControls
              language={language}
              className="mb-6 lg:hidden"
              toolbarClassName="flex-none"
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: t.filters,
                onToggle: () => setShowFilters(!showFilters),
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
                    showCategory
                  />
                ),
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

            {isSearching ? (
              <div className="py-2.5">
                <PostResultsGridSkeleton viewMode="list" count={12} />
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
                  title: language === "ar" ? "لم يتم العثور على منشورات" : "No Posts Found",
                  description:
                    language === "ar"
                      ? "حاول تعديل الفلاتر أو مصطلحات البحث للعثور على ما تبحث عنه."
                      : "Try adjusting your filters or search terms to find what you're looking for.",
                  actionLabel: t.clearFilters,
                  onAction: () => {
                    clearFilters();
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

import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import {
  AdvancedSearchFilters,
  type SearchFilters,
} from "../components/AdvancedSearchFilters";
import { ArrowLeft } from "lucide-react";

import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";

import { Language } from "../../../translations";
import { Post } from "../../../types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { rankMarketplacePosts } from "../search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";
import { useMarketplaceSearchFilter } from "../../../shared/hooks/useMarketplaceSearchFilter";

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
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(
    initialSearchQuery.trim(),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [appliedSearchFilters, setAppliedSearchFilters] =
    useState<SearchFilters>({ sortBy: "views", sortOrder: "desc" });
  const [draftSearchFilters, setDraftSearchFilters] = useState<SearchFilters>({
    sortBy: "views",
    sortOrder: "desc",
  });

  const { normalizedSearchQuery, clearSearch: clearAppliedSearch } =
    useMarketplaceSearchFilter({
      language,
      searchQuery: appliedSearchQuery,
      setSearchQuery: setAppliedSearchQuery,
    });
  const clearSearch = useCallback(() => {
    clearAppliedSearch();
    onSearch("");
  }, [clearAppliedSearch, onSearch]);

  const buildFallbackPosts = useCallback(
    ({ activePosts, query }: { activePosts: Post[]; query: string }) => {
      let results = activePosts;

      if (appliedSearchFilters.minPrice != null) {
        results = results.filter(
          (p) => p.price >= (appliedSearchFilters.minPrice ?? 0),
        );
      }
      if (appliedSearchFilters.maxPrice != null) {
        results = results.filter(
          (p) => p.price <= (appliedSearchFilters.maxPrice ?? Infinity),
        );
      }
      if (query) {
        results = rankMarketplacePosts(results, query);
      }

      // Apply sorting
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
  } = useMarketplaceSearchResults({
    preset: "search-results",
    query: normalizedSearchQuery,
    sourcePosts: posts,
    page: 1,
    sortBy: appliedSearchFilters.sortBy || "date",
    sortOrder: appliedSearchFilters.sortOrder || "desc",
    minPrice: appliedSearchFilters.minPrice,
    maxPrice: appliedSearchFilters.maxPrice,
    fallbackErrorMessage: "Search failed",
    buildFallbackPosts,
    transformRemotePosts,
  });

  // Apply category & city filters client-side (API doesn't support them)
  const filteredPosts = useMemo(() => {
    let results = searchPosts;
    if (appliedSearchFilters.category) {
      results = results.filter(
        (p) =>
          p.category?.toLowerCase() ===
          appliedSearchFilters.category?.toLowerCase(),
      );
    }
    if (appliedSearchFilters.city) {
      const cityFilter = appliedSearchFilters.city.toLowerCase();
      results = results.filter((p) =>
        p.location?.toLowerCase().includes(cityFilter) ||
        p.locationAr?.toLowerCase().includes(cityFilter)
      );
    }
    return results;
  }, [searchPosts, appliedSearchFilters.category, appliedSearchFilters.city]);

  const {
    viewMode,
    displayedResults: displayedPosts,
    shouldShowPagination,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: filteredPosts,
    itemsPerPage: 12,
    defaultViewMode: "list",
    storageKey: "tijarahjo_view_mode_search",
  });

  useEffect(() => {
    const normalizedInitialQuery = initialSearchQuery.trim();
    setAppliedSearchQuery(normalizedInitialQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    setDraftSearchFilters(appliedSearchFilters);
  }, [appliedSearchFilters]);

  const applySearchFilters = useCallback(() => {
    setAppliedSearchFilters(draftSearchFilters);
    setShowFilters(false);
  }, [draftSearchFilters]);

  return (
    <PageShell>
      {/* Main Content */}
      <main className="mx-auto w-full max-w-376 px-4 pt-6 pb-8 sm:px-6 lg:px-8 xl:px-10">
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
              onClear={() => {
                const defaultSort = {
                  sortBy: "views" as const,
                  sortOrder: "desc" as const,
                };
                setDraftSearchFilters(defaultSort);
                setAppliedSearchFilters(defaultSort);
              }}
              showApplyButton={false}
              showCategory
            />
          </div>

          {/* Main Results Area */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                {language === "ar" ? "نتائج البحث" : "Search Results"}
              </h1>
            </div>
            <MarketplaceQueryStatus
              isLoading={isSearching}
              error={searchError}
              loadingLabel={
                language === "ar" ? "جاري البحث..." : "Searching..."
              }
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
                    onApply={applySearchFilters}
                    onClear={() => {
                      const defaultSort = {
                        sortBy: "views" as const,
                        sortOrder: "desc" as const,
                      };
                      setDraftSearchFilters(defaultSort);
                      setAppliedSearchFilters(defaultSort);
                      setShowFilters(false);
                    }}
                    showCategory
                  />
                ),
                onToggle: () => setShowFilters(!showFilters),
              }}
            />

            {isSearching ? (
              <div className="py-2.5">
                <PostResultsGridSkeleton viewMode={viewMode} count={8} />
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

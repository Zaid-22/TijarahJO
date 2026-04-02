import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceActiveFilters } from "../components/MarketplaceActiveFilters";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import {
  AdvancedSearchFilters,
  type SearchFilters,
} from "../components/AdvancedSearchFilters";

import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";

import { Language } from "../../../translations";
import { Post } from "../../../types";
import { useCallback, useEffect, useState } from "react";
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
  currentUserDisplayName?: string;
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
  currentUserDisplayName,
  currentUserId,
  onRequireAuth,
}: SearchResultsPageProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(
    initialSearchQuery.trim(),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const {
    normalizedSearchQuery,
    activeSearchFilters: rawSearchFilters,
    clearSearch: clearAppliedSearch,
  } = useMarketplaceSearchFilter({
    language,
    searchQuery: appliedSearchQuery,
    setSearchQuery: setAppliedSearchQuery,
  });
  const clearSearch = useCallback(() => {
    setLocalSearchQuery("");
    clearAppliedSearch();
    onSearch("");
  }, [clearAppliedSearch, onSearch]);
  const submitSearch = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim();
      setLocalSearchQuery(query);
      setAppliedSearchQuery(normalizedQuery);
      onSearch(normalizedQuery);
    },
    [onSearch],
  );

  // Build active filter items for the filter chips UI
  const activeFilterItems = [
    ...rawSearchFilters.map((item) => ({
      ...item,
      onRemove: clearSearch,
    })),
    ...(searchFilters.category
      ? [
          {
            id: "category",
            label: `${language === "ar" ? "الفئة: " : "Category: "}${searchFilters.category}`,
            removeLabel:
              language === "ar" ? "إزالة فلتر الفئة" : "Remove category filter",
            onRemove: () =>
              setSearchFilters((f) => ({ ...f, category: undefined })),
          },
        ]
      : []),
    ...(searchFilters.city
      ? [
          {
            id: "city",
            label: `${language === "ar" ? "المدينة: " : "City: "}${searchFilters.city}`,
            removeLabel:
              language === "ar" ? "إزالة فلتر المدينة" : "Remove city filter",
            onRemove: () =>
              setSearchFilters((f) => ({ ...f, city: undefined })),
          },
        ]
      : []),
    ...(searchFilters.minPrice || searchFilters.maxPrice
      ? [
          {
            id: "price",
            label: `${language === "ar" ? "السعر: " : "Price: "}${searchFilters.minPrice ?? 0} - ${searchFilters.maxPrice ?? "∞"} ${language === "ar" ? "د.أ" : "JOD"}`,
            removeLabel:
              language === "ar" ? "إزالة فلتر السعر" : "Remove price filter",
            onRemove: () =>
              setSearchFilters((f) => ({
                ...f,
                minPrice: undefined,
                maxPrice: undefined,
              })),
          },
        ]
      : []),
  ];

  const buildFallbackPosts = useCallback(
    ({ activePosts, query }: { activePosts: Post[]; query: string }) => {
      let results = activePosts;

      // Apply local filters
      if (searchFilters.category) {
        results = results.filter(
          (p) =>
            p.category?.toLowerCase() === searchFilters.category?.toLowerCase(),
        );
      }
      if (searchFilters.city) {
        results = results.filter((p) =>
          p.location?.toLowerCase().includes(searchFilters.city!.toLowerCase()),
        );
      }
      if (searchFilters.minPrice != null) {
        results = results.filter((p) => p.price >= searchFilters.minPrice!);
      }
      if (searchFilters.maxPrice != null) {
        results = results.filter((p) => p.price <= searchFilters.maxPrice!);
      }
      if (query) {
        results = rankMarketplacePosts(results, query);
      }

      // Apply sorting
      if (searchFilters.sortBy) {
        const order = searchFilters.sortOrder === "asc" ? 1 : -1;
        results = [...results].sort((a, b) => {
          if (searchFilters.sortBy === "price") {
            return (a.price - b.price) * order;
          }
          if (searchFilters.sortBy === "views") {
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
    [searchFilters],
  );

  const transformRemotePosts = useCallback(
    (remotePosts: Post[], query: string) =>
      rankMarketplacePosts(remotePosts, query),
    [],
  );
  const {
    posts: filteredPosts,
    isSearching,
    error: searchError,
  } = useMarketplaceSearchResults({
    preset: "search-results",
    query: normalizedSearchQuery,
    sourcePosts: posts,
    page: 1,
    sortBy: searchFilters.sortBy || "date",
    sortOrder: searchFilters.sortOrder || "desc",
    minPrice: searchFilters.minPrice,
    maxPrice: searchFilters.maxPrice,
    fallbackErrorMessage: "Search failed",
    buildFallbackPosts,
    transformRemotePosts,
  });
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
    setLocalSearchQuery(initialSearchQuery);
    setAppliedSearchQuery(normalizedInitialQuery);
  }, [initialSearchQuery]);

  const clearAllFilters = useCallback(() => {
    setSearchFilters({});
    clearSearch();
  }, [clearSearch]);

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={language === "ar"}
        backLabel={language === "ar" ? "العودة" : "Back"}
        showLogo={false}
        title={
          normalizedSearchQuery
            ? language === "ar"
              ? `نتائج البحث عن "${normalizedSearchQuery}"`
              : `Search results for "${normalizedSearchQuery}"`
            : language === "ar"
              ? "نتائج البحث"
              : "Search results"
        }
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <AdvancedSearchFilters
                language={language}
                filters={searchFilters}
                onFiltersChange={setSearchFilters}
                onApply={() => {
                  /* filters apply reactively */
                }}
                onClear={() => setSearchFilters({})}
              />
            </div>
          </aside>

          {/* Main Results Area */}
          <div className="flex-1 min-w-0">
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
              search={{
                value: localSearchQuery,
                placeholder:
                  language === "ar"
                    ? "ابحث في النتائج..."
                    : "Search results...",
                clearLabel: language === "ar" ? "مسح البحث" : "Clear search",
                onChange: setLocalSearchQuery,
                onSubmit: submitSearch,
              }}
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: language === "ar" ? "الفلاتر" : "Filters",
                content: (
                  <AdvancedSearchFilters
                    language={language}
                    filters={searchFilters}
                    onFiltersChange={setSearchFilters}
                    onApply={() => setShowFilters(false)}
                    onClear={() => {
                      setSearchFilters({});
                      setShowFilters(false);
                    }}
                  />
                ),
                onToggle: () => setShowFilters(!showFilters),
              }}
              activeFilters={
                activeFilterItems.length > 0 ? (
                  <MarketplaceActiveFilters
                    title={
                      language === "ar" ? "الفلاتر النشطة" : "Active filters"
                    }
                    items={activeFilterItems}
                    clearAllLabel={language === "ar" ? "مسح الكل" : "Clear all"}
                    onClearAll={clearAllFilters}
                  />
                ) : undefined
              }
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
                currentUserDisplayName={currentUserDisplayName}
                language={language}
                animated
                emptyState={{
                  title: language === "ar" ? "لا توجد نتائج" : "No results found",
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

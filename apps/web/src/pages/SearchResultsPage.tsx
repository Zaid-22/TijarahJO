import { SubpageHeader } from "../shared/ui/subpage-header";
import { PageShell } from "../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../features/marketplace/components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../features/marketplace/components/MarketplaceQueryStatus";
import { MarketplaceActiveFilters } from "../features/marketplace/components/MarketplaceActiveFilters";
import { MarketplaceResultsPagination } from "../features/marketplace/components/MarketplaceResultsPagination";

import { PostResultsGrid } from "../features/marketplace/components/PostResultsGrid";

import { Language } from "../translations";
import { Post } from "../types";
import { useCallback, useEffect, useState } from "react";
import {
  rankMarketplacePosts,
} from "../features/marketplace/search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../features/marketplace/search/useMarketplaceSearchResults";
import { useMarketplaceDiscoveryState } from "../shared/hooks/useMarketplaceDiscoveryState";
import { useMarketplaceSearchFilter } from "../shared/hooks/useMarketplaceSearchFilter";

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
}: SearchResultsPageProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(
    initialSearchQuery.trim(),
  );
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
  const submitSearch = useCallback(() => {
    const normalizedQuery = localSearchQuery.trim();
    setAppliedSearchQuery(normalizedQuery);
    onSearch(normalizedQuery);
  }, [localSearchQuery, onSearch]);
  const activeSearchFilters = rawSearchFilters.map((item) => ({
    ...item,
    onRemove: clearSearch,
  }));
  const buildFallbackPosts = useCallback(
    ({
      activePosts,
      query,
    }: {
      activePosts: Post[];
      query: string;
    }) => {
      if (!query) {
        return activePosts;
      }

      return rankMarketplacePosts(activePosts, query);
    },
    [],
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
    sortBy: "date",
    sortOrder: "desc",
    fallbackErrorMessage: "Search failed",
    buildFallbackPosts,
    transformRemotePosts,
  });
  const {
    viewMode,
    setViewMode,
    displayedResults: displayedPosts,
    shouldShowPagination,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: filteredPosts,
    itemsPerPage: 12,
  });

  useEffect(() => {
    const normalizedInitialQuery = initialSearchQuery.trim();
    setLocalSearchQuery(initialSearchQuery);
    setAppliedSearchQuery(normalizedInitialQuery);
  }, [initialSearchQuery]);

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
        <MarketplaceQueryStatus
          isLoading={isSearching}
          error={searchError}
          loadingLabel={language === "ar" ? "جاري البحث..." : "Searching..."}
        />

        <MarketplaceDiscoveryControls
          language={language}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          toolbarClassName="mb-8"
          search={{
            value: localSearchQuery,
            placeholder: language === "ar" ? "ابحث في النتائج..." : "Search results...",
            clearLabel: language === "ar" ? "مسح البحث" : "Clear search",
            onChange: setLocalSearchQuery,
            onSubmit: submitSearch,
          }}
          activeFilters={
            activeSearchFilters.length > 0 ? (
              <MarketplaceActiveFilters
                title={language === "ar" ? "الفلاتر النشطة" : "Active filters"}
                items={activeSearchFilters}
                clearAllLabel={language === "ar" ? "مسح الكل" : "Clear all"}
                onClearAll={clearSearch}
              />
            ) : undefined
          }
        />

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
            actionLabel: language === "ar" ? "العودة إلى السوق" : "Back to Marketplace",
            onAction: () => {
              clearSearch();
              onBack();
            },
          }}
        />
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
      </main>
    </PageShell>
  );
}

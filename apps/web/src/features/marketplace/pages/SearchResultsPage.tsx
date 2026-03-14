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

import { Language } from "../../../translations";
import { Post } from "../../../types";
import { useCallback, useEffect, useState } from "react";
import { rankMarketplacePosts } from "../search/marketplaceSearch";
import { useMarketplaceSearchResults } from "../search/useMarketplaceSearchResults";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";
import { useMarketplaceSearchFilter } from "../../../shared/hooks/useMarketplaceSearchFilter";
import { useSavedSearches } from "../../../shared/hooks/useSavedSearches";
import { Bookmark, BookmarkCheck } from "lucide-react";

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
    ...(searchFilters.condition
      ? [
          {
            id: "condition",
            label: `${language === "ar" ? "الحالة: " : "Condition: "}${searchFilters.condition}`,
            removeLabel:
              language === "ar"
                ? "إزالة فلتر الحالة"
                : "Remove condition filter",
            onRemove: () =>
              setSearchFilters((f) => ({ ...f, condition: undefined })),
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
      if (searchFilters.condition) {
        results = results.filter(
          (p) =>
            p.condition?.toLowerCase() ===
            searchFilters.condition?.toLowerCase(),
        );
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

  const clearAllFilters = useCallback(() => {
    setSearchFilters({});
    clearSearch();
  }, [clearSearch]);

  const { addSavedSearch, isSearchSaved } = useSavedSearches();
  const currentSearchIsSaved = isSearchSaved(
    normalizedSearchQuery,
    searchFilters.category,
    searchFilters.city,
  );

  const handleSaveSearch = useCallback(() => {
    if (
      !normalizedSearchQuery &&
      !searchFilters.category &&
      !searchFilters.city
    )
      return;
    addSavedSearch({
      query: normalizedSearchQuery,
      category: searchFilters.category,
      city: searchFilters.city,
      minPrice: searchFilters.minPrice,
      maxPrice: searchFilters.maxPrice,
    });
  }, [normalizedSearchQuery, searchFilters, addSavedSearch]);

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
        rightContent={
          normalizedSearchQuery ? (
            <button
              type="button"
              onClick={handleSaveSearch}
              disabled={currentSearchIsSaved}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentSearchIsSaved
                  ? "bg-primary/10 text-primary cursor-default"
                  : "bg-card border border-border text-foreground hover:border-primary/30"
              }`}
              aria-label={language === "ar" ? "حفظ البحث" : "Save search"}
            >
              {currentSearchIsSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  {language === "ar" ? "محفوظ" : "Saved"}
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  {language === "ar" ? "حفظ البحث" : "Save"}
                </>
              )}
            </button>
          ) : null
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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              toolbarClassName="mb-4"
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
          </div>
        </div>
      </main>
    </PageShell>
  );
}

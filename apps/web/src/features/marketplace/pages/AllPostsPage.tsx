import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceQueryStatus } from "../components/MarketplaceQueryStatus";
import { MarketplaceActiveFilters } from "../components/MarketplaceActiveFilters";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import {
  useAllPostsFilters,
} from "../hooks/useAllPostsFilters";
import {
  getAllPostsPriceRangeOptions,
  getAllPostsSortOptions,
  type AllPostsPriceRange,
  type AllPostsSortBy,
} from "../../../shared/lib/marketplaceControls";
import { MarketplaceSortSelect } from "../components/MarketplaceSortSelect";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";
import { useMarketplaceSearchFilter } from "../../../shared/hooks/useMarketplaceSearchFilter";
import { useCallback, useState } from "react";

interface AllPostsPageProps {
  onBack: () => void;
  posts: Post[];
  onPostClick: (postId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  language: Language;
  isAuthenticated?: boolean;
  darkMode?: boolean;
  currentUserDisplayName?: string;
  currentUserId?: string;
  onRequireAuth?: () => void;
}

interface AllPostsFilterControlsProps {
  language: Language;
  priceRange: AllPostsPriceRange;
  sortBy: AllPostsSortBy;
  compact?: boolean;
  onPriceRangeChange: (value: AllPostsPriceRange) => void;
  onSortByChange: (value: AllPostsSortBy) => void;
}

function AllPostsFilterControls({
  language,
  priceRange,
  sortBy,
  compact = false,
  onPriceRangeChange,
  onSortByChange,
}: AllPostsFilterControlsProps) {
  const t = translations[language];
  const priceRangeOptions = getAllPostsPriceRangeOptions(language);
  const sortOptions = getAllPostsSortOptions(language);
  const triggerWidthClass = compact ? "" : "w-48";

  return (
    <>
      <MarketplaceSortSelect
        value={priceRange}
        options={priceRangeOptions}
        onValueChange={onPriceRangeChange}
        triggerClassName={triggerWidthClass}
        placeholder={t.priceRange}
      />

      <MarketplaceSortSelect
        value={sortBy}
        options={sortOptions}
        onValueChange={onSortByChange}
        triggerClassName={triggerWidthClass}
        placeholder={t.sortBy}
      />
    </>
  );
}

export function AllPostsPage({
  onBack,
  posts,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  isAuthenticated = false,
  darkMode = false,
  currentUserDisplayName,
  currentUserId,
  onRequireAuth,
}: AllPostsPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const [searchInputValue, setSearchInputValue] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const {
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    showFilters,
    setShowFilters,
    filteredPosts,
    isSearching,
    searchError,
  } = useAllPostsFilters({
    posts,
    language,
    searchQuery: appliedSearchQuery,
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
    defaultViewMode: "list",
    storageKey: "tijarahjo_view_mode_all_posts",
  });
  const {
    activeSearchFilters: rawSearchFilters,
    clearSearch: clearAppliedSearch,
  } = useMarketplaceSearchFilter({
    language,
    searchQuery: appliedSearchQuery,
    setSearchQuery: setAppliedSearchQuery,
  });
  const clearSearch = useCallback(() => {
    setSearchInputValue("");
    clearAppliedSearch();
  }, [clearAppliedSearch]);
  const submitSearch = useCallback((query: string) => {
    setSearchInputValue(query);
    setAppliedSearchQuery(query.trim());
  }, []);
  const activeSearchFilters = rawSearchFilters.map((item) => ({
    ...item,
    onRemove: clearSearch,
  }));
  const activeFilterItems = [
    ...activeSearchFilters,
    priceRange !== "all"
      ? {
          id: "priceRange",
          label: `${priceRange} JOD`,
          removeLabel:
            language === "ar"
              ? `إزالة فلتر السعر ${priceRange} دينار`
              : `Remove price filter ${priceRange} JOD`,
          onRemove: () => setPriceRange("all"),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={t.backToMarketplace}
        showLogo={true}
        onLogoClick={onBack}
        logoDarkMode={darkMode}
      />

      <div className="border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <MarketplaceDiscoveryControls
              language={language}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              search={{
                value: searchInputValue,
                placeholder:
                  language === "ar"
                    ? "البحث في جميع المنشورات..."
                    : "Search all posts...",
                clearLabel: language === "ar" ? "مسح البحث" : "Clear search",
                onChange: setSearchInputValue,
                onSubmit: submitSearch,
              }}
              leftControls={(
                <div className="hidden lg:flex items-center gap-3 flex-wrap">
                  <AllPostsFilterControls
                    language={language}
                    priceRange={priceRange}
                    sortBy={sortBy}
                    onPriceRangeChange={setPriceRange}
                    onSortByChange={setSortBy}
                  />
                </div>
              )}
              mobileFilters={{
                isOpen: showFilters,
                toggleLabel: t.filters,
                onToggle: () => setShowFilters(!showFilters),
                content: (
                  <AllPostsFilterControls
                    language={language}
                    priceRange={priceRange}
                    sortBy={sortBy}
                    compact
                    onPriceRangeChange={setPriceRange}
                    onSortByChange={setSortBy}
                  />
                ),
              }}
              activeFilters={
                <MarketplaceActiveFilters
                  title={t.activeFilters}
                  items={activeFilterItems}
                  clearAllLabel={t.clearAll}
                  onClearAll={() => {
                    clearSearch();
                    setPriceRange("all");
                  }}
                />
              }
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketplaceQueryStatus
          isLoading={isSearching}
          error={searchError}
          loadingLabel={
            language === "ar" ? "جاري تحميل النتائج..." : "Loading results..."
          }
        />
        {isSearching ? (
          <div className="py-2.5">
            <PostResultsGridSkeleton viewMode={viewMode} count={12} />
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
            emptyState={{
              title: language === "ar" ? "لم يتم العثور على منشورات" : "No Posts Found",
              description:
                language === "ar"
                  ? "حاول تعديل الفلاتر أو مصطلحات البحث للعثور على ما تبحث عنه."
                  : "Try adjusting your filters or search terms to find what you're looking for.",
              actionLabel: t.clearFilters,
              onAction: () => {
                clearSearch();
                setPriceRange("all");
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

    </PageShell>
  );
}

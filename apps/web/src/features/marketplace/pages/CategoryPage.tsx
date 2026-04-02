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
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { MarketplaceDiscoveryControls } from "../components/MarketplaceDiscoveryControls";
import { MarketplaceResultsPagination } from "../components/MarketplaceResultsPagination";
import { useMemo, useState } from "react";
import {
  sortMarketplacePosts,
  type PostSortMode,
} from "../../../shared/lib/postSorting";
import { getCategorySortOptions } from "../../../shared/lib/marketplaceControls";
import { MarketplaceSortSelect } from "../components/MarketplaceSortSelect";
import { useMarketplaceDiscoveryState } from "../../../shared/hooks/useMarketplaceDiscoveryState";

interface CategoryPageProps {
  categoryName: string;
  onBack: () => void;
  posts: Post[];
  onPostClick: (postId: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  language: Language;
  currentUserDisplayName?: string;
  currentUserId?: string;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  onRequireAuth?: () => void;
}

export function CategoryPage({
  categoryName,
  onBack,
  posts,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  currentUserDisplayName,
  currentUserId,
  isAuthenticated = false,
  isLoading = false,
  onRequireAuth,
}: CategoryPageProps) {
  const isRTL = language === "ar";
  const { categories } = useCatalogCategories();
  const categorySortOptions = useMemo(
    () => getCategorySortOptions(language),
    [language],
  );

  const [sortBy, setSortBy] = useState<PostSortMode>("newest");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const normalizedCategoryName = categoryName.trim().toLowerCase();
  const currentCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedCategoryName,
  );
  const displayCategoryName = currentCategory
    ? resolveCategoryName(currentCategory, language)
    : categoryName;

  const filteredPosts = useMemo(() => {
    const categoryPosts = posts.filter(
      (p) =>
        p.category.trim().toLowerCase() === normalizedCategoryName &&
        p.status !== "SOLD" &&
        p.status !== "DELETED",
    );
    return categoryPosts;
  }, [posts, normalizedCategoryName]);

  const sortedPosts = useMemo(() => {
    let results = [...filteredPosts];

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
    return sortMarketplacePosts(results, sortBy, language);
  }, [filteredPosts, searchFilters, sortBy, language]);

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

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={language === "ar" ? "العودة" : "Back"}
        showLogo={false}
        title={displayCategoryName}
        subtitle={
          language === "ar"
            ? `تصفح جميع ${displayCategoryName}`
            : `Browse all ${categoryName.toLowerCase()}`
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
                filters={{ ...searchFilters, category: displayCategoryName }}
                onFiltersChange={(f) => {
                  // Ignore category changes here, it's fixed
                  const { category: _c, ...rest } = f;
                  setSearchFilters(rest);
                }}
                onApply={() => {
                  /* filters apply reactively */
                }}
                onClear={() => setSearchFilters({})}
              />
            </div>
          </aside>

          {/* Main Results Area */}
          <div className="flex-1 min-w-0">
            {/* Controls Bar */}
            <MarketplaceDiscoveryControls
              language={language}
              toolbarClassName="flex-none"
              leftSlotClassName="gap-2 flex-1 sm:flex-initial"
              leftControls={
                <MarketplaceSortSelect
                  value={sortBy}
                  options={categorySortOptions}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                  placeholder={language === "ar" ? "ترتيب حسب" : "Sort by"}
                />
              }
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
                currentUserDisplayName={currentUserDisplayName}
                hideCategoryBadge
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

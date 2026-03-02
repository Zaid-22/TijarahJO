import { PostResultsGrid } from "../features/marketplace/components/PostResultsGrid";
import { PageShell } from "../shared/ui/page-shell";

import { Language } from "../translations";
import { Post } from "../types";
import { useCatalogCategories } from "../shared/hooks/useCatalogCategories";
import {
  resolveCategoryIcon,
  resolveCategoryName,
  resolveCategoryTextClass,
} from "../shared/lib/categoryVisuals";
import { SubpageHeader } from "../shared/ui/subpage-header";
import { MarketplaceDiscoveryControls } from "../features/marketplace/components/MarketplaceDiscoveryControls";
import { MarketplaceResultsPagination } from "../features/marketplace/components/MarketplaceResultsPagination";
import { useMemo, useState } from "react";
import {
  sortMarketplacePosts,
  type PostSortMode,
} from "../shared/lib/postSorting";
import { getCategorySortOptions } from "../shared/lib/marketplaceControls";
import { MarketplaceSortSelect } from "../features/marketplace/components/MarketplaceSortSelect";
import { useMarketplaceDiscoveryState } from "../shared/hooks/useMarketplaceDiscoveryState";

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
}: CategoryPageProps) {
  const isRTL = language === "ar";
  const { categories } = useCatalogCategories();
  const categorySortOptions = useMemo(
    () => getCategorySortOptions(language),
    [language],
  );

  const [sortBy, setSortBy] = useState<PostSortMode>("newest");

  const normalizedCategoryName = categoryName.trim().toLowerCase();
  const currentCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedCategoryName,
  );
  const CategoryIcon = resolveCategoryIcon(currentCategory?.icon);
  const categoryTextClass = resolveCategoryTextClass(currentCategory?.color);
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
    return sortMarketplacePosts(filteredPosts, sortBy, language);
  }, [filteredPosts, sortBy, language]);

  const {
    viewMode,
    setViewMode,
    displayedResults: displayedPosts,
    shouldShowPagination,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: sortedPosts,
    itemsPerPage: 12,
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
        rightContent={(
          <div className="rounded-xl border border-border bg-muted/70 p-2">
            <CategoryIcon className={`w-6 h-6 ${categoryTextClass}`} />
          </div>
        )}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Bar */}
        <MarketplaceDiscoveryControls
          language={language}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          toolbarClassName="mb-6"
          leftSlotClassName="gap-2 flex-1 sm:flex-initial"
          leftControls={(
            <MarketplaceSortSelect
              value={sortBy}
              options={categorySortOptions}
              onValueChange={(value) => setSortBy(value as typeof sortBy)}
              placeholder={language === "ar" ? "ترتيب حسب" : "Sort by"}
            />
          )}
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
          hideCategoryBadge
          language={language}
          emptyState={{
            title: language === "ar" ? "لا توجد نتائج" : "No results found",
            description:
              language === "ar"
                ? "لا توجد منشورات متاحة في هذه الفئة"
                : "No posts available in this category",
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

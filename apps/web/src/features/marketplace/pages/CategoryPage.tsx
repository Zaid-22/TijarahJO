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
import { useState, useMemo } from "react";
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

  const [appliedSearchFilters, setAppliedSearchFilters] = useState<SearchFilters>(
    {},
  );

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

    if (appliedSearchFilters.city) {
      results = results.filter((p) =>
        p.location?.toLowerCase().includes(
          appliedSearchFilters.city!.toLowerCase(),
        ),
      );
    }
    if (appliedSearchFilters.minPrice != null) {
      results = results.filter((p) => p.price >= appliedSearchFilters.minPrice!);
    }
    if (appliedSearchFilters.maxPrice != null) {
      results = results.filter((p) => p.price <= appliedSearchFilters.maxPrice!);
    }
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
  }, [filteredPosts, appliedSearchFilters]);

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
  const resultsSummary =
    language === "ar"
      ? `${sortedPosts.length} ${sortedPosts.length === 1 ? "نتيجة" : "نتائج"}`
      : `${sortedPosts.length} ${sortedPosts.length === 1 ? "result" : "results"}`;

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
      <main className="mx-auto w-full max-w-[94rem] px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-7 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <AdvancedSearchFilters
                language={language}
                filters={{ ...appliedSearchFilters, category: displayCategoryName }}
                onFiltersChange={setAppliedSearchFilters}
                onApply={() => {}}
                onClear={() => {
                  setAppliedSearchFilters({});
                }}
                hideCategory
                showApplyButton={false}
              />
            </div>
          </aside>

          {/* Main Results Area */}
          <div className="min-w-0 rounded-[30px] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/30 to-white p-4 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.45)] sm:p-5 xl:p-6">
            <div className="mb-5 rounded-[22px] border border-slate-200/70 bg-white/85 px-4 py-4 shadow-[0_12px_40px_-32px_rgba(15,23,42,0.35)] backdrop-blur sm:px-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                  {resultsSummary}
                </p>
                <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {displayCategoryName}
                </h2>
              </div>
            </div>

            {/* Controls Bar */}
            <MarketplaceDiscoveryControls
              language={language}
              className="mb-5"
              toolbarClassName="flex-none"
              leftSlotClassName="gap-2 flex-1 sm:flex-initial"
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

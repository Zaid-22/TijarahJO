import { PostGridSkeleton } from "../shared/ui/post-card-skeleton";
import { PostResultsGrid } from "../features/marketplace/components/PostResultsGrid";
import { MarketplaceResultsPagination } from "../features/marketplace/components/MarketplaceResultsPagination";
import { Language, Post, ViewMode } from "../types";
import { APP_CONFIG } from "../constants/appConfig";
import { HomeHeroSection } from "../features/home/components/HomeHeroSection";
import { HomeCategoriesSection } from "../features/home/components/HomeCategoriesSection";
import { MarketplaceDiscoveryControls } from "../features/marketplace/components/MarketplaceDiscoveryControls";
import { usePrefersReducedMotion } from "../shared/hooks/usePrefersReducedMotion";
import { PageShell } from "../shared/ui/page-shell";

interface HomePageProps {
  language: Language;
  isAuthenticated: boolean;
  t: Record<string, string>;
  isRTL: boolean;
  darkMode: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Navigation / Actions
  setShowLoginPrompt: (show: boolean) => void;
  setShowSellItem: (show: boolean) => void;
  setShowAllPosts: (show: boolean) => void;
  setSelectedCategoryForPage: (category: string) => void;

  // Data
  isLoadingPosts: boolean;
  postsError: string | null;
  displayedPosts: Post[];

  // View Control
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Post Actions
  onPostClick: (id: string, origin?: string) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  currentUserDisplayName: string;
  currentUserId?: string;

  // Pagination
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;

  // Helpers
  getCategoryTranslation: (name: string) => string;
}

export function HomePage({
  language,
  isAuthenticated,
  t,
  isRTL,
  darkMode,
  searchQuery,
  setSearchQuery,
  setShowLoginPrompt,
  setShowSellItem,
  setShowAllPosts,
  setSelectedCategoryForPage,
  isLoadingPosts,
  postsError,
  displayedPosts,
  viewMode,
  setViewMode,
  onPostClick,
  favoriteIds,
  toggleFavorite,
  currentUserDisplayName,
  currentUserId,
  currentPage,
  totalPages,
  isLoading,
  goToNextPage,
  goToPreviousPage,
  getCategoryTranslation,
}: HomePageProps) {
  const backendUrlHint = APP_CONFIG.backendHostUrl;
  const prefersReducedMotion = usePrefersReducedMotion();

  const scrollToTop = () => {
    const mainContent = document.getElementById("home-marketplace-content");
    mainContent?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <PageShell>
      <HomeHeroSection
        language={language}
        isAuthenticated={isAuthenticated}
        t={t}
        isRTL={isRTL}
        darkMode={darkMode}
        setShowLoginPrompt={setShowLoginPrompt}
        setShowSellItem={setShowSellItem}
        onBrowseItems={scrollToTop}
      />
      <HomeCategoriesSection
        language={language}
        t={t}
        getCategoryTranslation={getCategoryTranslation}
        setSelectedCategoryForPage={setSelectedCategoryForPage}
        setShowAllPosts={setShowAllPosts}
      />

      {/* Main Content */}
      <section
        id="home-marketplace-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* View Controls Only */}
        <MarketplaceDiscoveryControls
          language={language}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="mb-8"
          showViewModeOnMobile
        />

        {/* Loading State */}
        {isLoadingPosts && <PostGridSkeleton viewMode={viewMode} />}

        {/* Error State */}
        {!isLoadingPosts && postsError && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              {postsError}
            </p>
            {postsError.includes("Cannot connect") && (
              <p className="text-yellow-700 dark:text-yellow-300 text-xs text-center mt-2">
                {language === "ar"
                  ? `تأكد من تشغيل الخادم الخلفي على ${backendUrlHint}`
                  : `Make sure the backend server is running on ${backendUrlHint}`}
              </p>
            )}
          </div>
        )}

        {/* Post Grid */}
        {!isLoadingPosts && (
          <PostResultsGrid
            posts={displayedPosts}
            viewMode={viewMode}
            onPostClick={(id) => onPostClick(id, "marketplace")}
            favoriteIds={favoriteIds}
            onFavoriteToggle={toggleFavorite}
            language={language}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            currentUserDisplayName={currentUserDisplayName}
            animated
            emptyState={{
              title: searchQuery
                ? language === "ar"
                  ? "لا توجد نتائج"
                  : "No results found"
                : language === "ar"
                  ? "لا توجد منشورات"
                  : "No posts found",
              description: searchQuery
                ? language === "ar"
                  ? `لم نتمكن من العثور على أي منشورات تطابق "${searchQuery}"`
                  : `We couldn't find any posts matching "${searchQuery}"`
                : language === "ar"
                  ? "جرب فئة أخرى أو أضف منشورات جديدة"
                  : "Try a different category or add new posts",
              actionLabel: searchQuery
                ? language === "ar"
                  ? "مسح البحث"
                  : "Clear Search"
                : undefined,
              onAction: searchQuery ? () => setSearchQuery("") : undefined,
            }}
          />
        )}

        {displayedPosts.length > 0 ? (
          <MarketplaceResultsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={isLoading}
            language={language}
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
            className="mt-12 mb-8"
            showLoadingIndicator
          />
        ) : null}
      </section>
    </PageShell>
  );
}

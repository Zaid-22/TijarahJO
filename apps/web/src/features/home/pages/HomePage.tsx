import { Suspense, lazy } from "react";
import { Language, Post, ViewMode } from "../../../types";
import { APP_CONFIG } from "../../../constants/appConfig";
import { HomeHeroSection } from "../components/HomeHeroSection";
import { HomeCategoriesSection } from "../components/HomeCategoriesSection";
import { PostCarouselSkeleton } from "../components/PostCarouselSkeleton";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { PageShell } from "../../../shared/ui/page-shell";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import type { Category } from "../../../types/api";

function lazyImportWithRetry<TModule>(
  load: () => Promise<TModule>,
  retryKey: string,
) {
  return async () => {
    try {
      const module = await load();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(retryKey);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRecoverableImportError =
        /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
          message,
        );

      if (
        typeof window !== "undefined" &&
        isRecoverableImportError &&
        !window.sessionStorage.getItem(retryKey)
      ) {
        window.sessionStorage.setItem(retryKey, "1");
        window.location.reload();

        return new Promise<never>(() => {
          // Keep React.lazy pending while the page reload is in flight.
        });
      }

      throw error;
    }
  };
}

const HomeDeferredSections = lazy(
  lazyImportWithRetry(
    () =>
      import("../components/HomeDeferredSections").then((m) => ({
        default: m.HomeDeferredSections,
      })),
    "lazy-import-retry:home-deferred-sections",
  ),
);

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
  availablePosts: Post[];
  filteredPosts: Post[];

  // View Control
  viewMode?: ViewMode;

  // Post Actions
  onPostClick: (id: string, origin?: string) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  currentUserDisplayName: string;
  currentUserId?: string;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
  goToNextPage?: () => void;
  goToPreviousPage?: () => void;

  // Helpers
  getCategoryTranslation: (name: string) => string;
  onNavigate?: (path: string) => void;
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
  displayedPosts = [],
  availablePosts = [],
  filteredPosts = [],
  viewMode: _viewMode,
  onPostClick,
  favoriteIds = [],
  toggleFavorite,
  currentUserDisplayName,
  currentUserId,
  currentPage: _currentPage,
  totalPages: _totalPages,
  isLoading: _isLoading,
  goToNextPage: _goToNextPage,
  goToPreviousPage: _goToPreviousPage,
  getCategoryTranslation,
  onNavigate,
}: HomePageProps) {
  const backendUrlHint = APP_CONFIG.backendHostUrl;
  const prefersReducedMotion = usePrefersReducedMotion();
  const { categories, isLoading: isLoadingCategories } = useCatalogCategories({
    useInitialFallback: true,
  });

  const scrollToTop = () => {
    const mainContent = document.getElementById("home-marketplace-content");
    mainContent?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <PageShell>
      {/* 1. Hero Section */}
      <HomeHeroSection
        language={language}
        isAuthenticated={isAuthenticated}
        t={t}
        isRTL={isRTL}
        darkMode={darkMode}
        setShowLoginPrompt={setShowLoginPrompt}
        setShowSellItem={setShowSellItem}
        onBrowseItems={scrollToTop}
        onNavigate={onNavigate}
      />

      {/* 2. Categories - Circular icons */}
      <HomeCategoriesSection
        language={language}
        t={t}
        categories={categories}
        isLoading={isLoadingCategories}
        getCategoryTranslation={getCategoryTranslation}
        setSelectedCategoryForPage={setSelectedCategoryForPage}
        setShowAllPosts={setShowAllPosts}
      />

      <Suspense
        fallback={
          <HomeDeferredSectionsFallback
            language={language}
            isLoadingPosts={isLoadingPosts}
            isLoadingCategories={isLoadingCategories}
          />
        }
      >
        <HomeDeferredSections
          language={language}
          isAuthenticated={isAuthenticated}
          isLoadingPosts={isLoadingPosts}
          isLoadingCategories={isLoadingCategories}
          postsError={postsError}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setShowLoginPrompt={setShowLoginPrompt}
          setShowSellItem={setShowSellItem}
          setShowAllPosts={setShowAllPosts}
          setSelectedCategoryForPage={setSelectedCategoryForPage}
          onPostClick={onPostClick}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          currentUserDisplayName={currentUserDisplayName}
          currentUserId={currentUserId}
          displayedPosts={displayedPosts}
          availablePosts={availablePosts}
          filteredPosts={filteredPosts}
          categories={categories as Category[]}
          backendUrlHint={backendUrlHint}
        />
      </Suspense>
    </PageShell>
  );
}

function HomeDeferredSectionsFallback({
  language,
  isLoadingPosts,
  isLoadingCategories,
}: {
  language: Language;
  isLoadingPosts: boolean;
  isLoadingCategories: boolean;
}) {
  return (
    <>
      {(isLoadingPosts || isLoadingCategories) ? <PostCarouselSkeleton hasSubtitle /> : null}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="overflow-hidden rounded-2xl bg-muted animate-pulse px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-6 w-48 rounded-md bg-background/60" />
              <div className="h-4 w-72 max-w-full rounded-md bg-background/50" />
            </div>
            <div className="h-11 w-36 rounded-xl bg-background/60" />
          </div>
        </div>
      </section>
      <section
        id="home-marketplace-content"
        aria-label={language === "ar" ? "محتوى السوق" : "Marketplace content"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <PostCarouselSkeleton hasSubtitle />
      </section>
    </>
  );
}

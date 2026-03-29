import { useMemo } from "react";
import { Globe } from "lucide-react";
import { Language, Post, ViewMode } from "../../../types";
import { APP_CONFIG } from "../../../constants/appConfig";
import { HomeHeroSection } from "../components/HomeHeroSection";
import { HomeCategoriesSection } from "../components/HomeCategoriesSection";
import { PostCarousel } from "../components/PostCarousel";
import { PostCarouselSkeleton } from "../components/PostCarouselSkeleton";
import { HomePromotionalBanner } from "../components/HomePromotionalBanner";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { PageShell } from "../../../shared/ui/page-shell";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";
import { isActivePost } from "../../../lib/searchRanking";
import { MarketplaceEmptyState } from "../../marketplace/components/MarketplaceEmptyState";

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
  displayedPosts,
  availablePosts,
  filteredPosts,
  viewMode: _viewMode,
  onPostClick,
  favoriteIds,
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
  const { categories, isLoading: isLoadingCategories } = useCatalogCategories();

  const scrollToTop = () => {
    const mainContent = document.getElementById("home-marketplace-content");
    mainContent?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  // Split posts for "Featured" carousel and main grid
  const featuredPosts = useMemo(() => {
    return displayedPosts.filter((p) => p.status !== "SOLD").slice(0, 10);
  }, [displayedPosts]);

  const recentPosts = useMemo(() => {
    return displayedPosts
      .filter(isActivePost)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [displayedPosts]);

  const allListingsCarouselPosts = useMemo(() => {
    return [...filteredPosts]
      .filter(isActivePost)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [filteredPosts]);

  const categorySections = useMemo(() => {
    const postsByCategory = new Map<string, Post[]>();

    availablePosts
      .filter(isActivePost)
      .forEach((post) => {
        const normalizedCategoryName = post.category.trim().toLowerCase();
        if (!normalizedCategoryName) {
          return;
        }

        const categoryPosts = postsByCategory.get(normalizedCategoryName) || [];
        categoryPosts.push(post);
        postsByCategory.set(normalizedCategoryName, categoryPosts);
      });

    return categories.flatMap((category) => {
      const normalizedCategoryName = category.name.trim().toLowerCase();
      const matchingPosts = postsByCategory.get(normalizedCategoryName);

      if (!matchingPosts || matchingPosts.length === 0) {
        return [];
      }

      return [
        {
          categoryName: category.name,
          displayName: resolveCategoryName(category, language),
          posts: [...matchingPosts]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 10),
        },
      ];
    });
  }, [availablePosts, categories, language]);

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

      {/* 3. Featured Items Carousel */}
      {isLoadingPosts ? (
        <PostCarouselSkeleton hasSubtitle />
      ) : featuredPosts.length > 0 ? (
        <PostCarousel
          title={language === "ar" ? "المنتجات المميزة" : "Featured Items"}
          subtitle={
            language === "ar"
              ? "أبرز المنتجات المتوفرة حالياً"
              : "Top picks available right now"
          }
          posts={featuredPosts}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          favoriteIds={favoriteIds}
          onFavoriteToggle={toggleFavorite}
          onPostClick={(id) => onPostClick(id, "featured")}
          onViewAll={() => setShowAllPosts(true)}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}



      {/* 5. Recent Items Carousel */}
      {isLoadingPosts ? (
        <PostCarouselSkeleton hasSubtitle />
      ) : recentPosts.length > 0 ? (
        <PostCarousel
          title={language === "ar" ? "أحدث الإعلانات" : "Recently Added"}
          subtitle={
            language === "ar"
              ? "أحدث ما تمت إضافته للمنصة"
              : "The latest listings on TijarahJO"
          }
          posts={recentPosts}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          favoriteIds={favoriteIds}
          onFavoriteToggle={toggleFavorite}
          onPostClick={(id) => onPostClick(id, "recent")}
          onViewAll={() => setShowAllPosts(true)}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}

      {!isLoadingPosts &&
      !isLoadingCategories &&
      categorySections.length > 0
        ? categorySections.map((section) => (
            <PostCarousel
              key={section.categoryName}
              title={section.displayName}
              subtitle={
                language === "ar"
                  ? `أحدث الإعلانات في ${section.displayName}`
                  : `Latest listings in ${section.displayName}`
              }
              posts={section.posts}
              language={language}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              currentUserDisplayName={currentUserDisplayName}
              favoriteIds={favoriteIds}
              onFavoriteToggle={toggleFavorite}
              onPostClick={(id) => onPostClick(id, section.categoryName)}
              onViewAll={() =>
                setSelectedCategoryForPage(section.categoryName)
              }
              viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
              onRequireAuth={() => setShowLoginPrompt(true)}
            />
          ))
        : null}

      {/* 6. Bottom Promotional Banner */}
      <HomePromotionalBanner
        title={
          language === "ar"
            ? "بيع في كل مكان بالأردن"
            : "Sell Across All of Jordan"
        }
        subtitle={
          language === "ar"
            ? "اعرض منتجاتك واوصل للمشترين في كل المحافظات"
            : "List your items and reach buyers in every governorate"
        }
        buttonLabel={
          isAuthenticated
            ? language === "ar"
              ? "أضف إعلان"
              : "Post a Listing"
            : language === "ar"
              ? "سجل الآن"
              : "Sign Up Now"
        }
        onButtonClick={() =>
          isAuthenticated ? setShowSellItem(true) : setShowLoginPrompt(true)
        }
        icon={Globe}
        variant="gradient"
      />

      {/* 7. Main Content - All Posts Grid */}
      <main
        id="home-marketplace-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {isLoadingPosts ? (
          <PostCarouselSkeleton hasSubtitle />
        ) : null}

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

        {!isLoadingPosts && !postsError && allListingsCarouselPosts.length > 0 ? (
          <PostCarousel
            title={language === "ar" ? "جميع المنتجات" : "All Listings"}
            subtitle={
              language === "ar"
                ? "تصفح جميع الإعلانات المتاحة"
                : "Browse all available listings"
            }
            posts={allListingsCarouselPosts}
            language={language}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            currentUserDisplayName={currentUserDisplayName}
            favoriteIds={favoriteIds}
            onFavoriteToggle={toggleFavorite}
            onPostClick={(id) => onPostClick(id, "marketplace")}
            onRequireAuth={() => setShowLoginPrompt(true)}
          />
        ) : null}

        {!isLoadingPosts &&
        !postsError &&
        allListingsCarouselPosts.length === 0 ? (
          <MarketplaceEmptyState
            title={
              searchQuery
                ? language === "ar"
                  ? "لا توجد نتائج"
                  : "No results found"
                : language === "ar"
                  ? "لا توجد منشورات"
                  : "No posts found"
            }
            description={
              searchQuery
                ? language === "ar"
                  ? `لم نتمكن من العثور على أي منشورات تطابق "${searchQuery}"`
                  : `We couldn't find any posts matching "${searchQuery}"`
                : language === "ar"
                  ? "جرب فئة أخرى أو أضف منشورات جديدة"
                  : "Try a different category or add new posts"
            }
            actionLabel={
              searchQuery
                ? language === "ar"
                  ? "مسح البحث"
                  : "Clear Search"
                : undefined
            }
            onAction={searchQuery ? () => setSearchQuery("") : undefined}
          />
        ) : null}
      </main>
    </PageShell>
  );
}

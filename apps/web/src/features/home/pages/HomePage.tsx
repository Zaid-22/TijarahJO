import { useMemo } from "react";
import { Globe, Star } from "lucide-react";
import { PostResultsGrid } from "../../marketplace/components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../../marketplace/components/PostResultsGridSkeleton";
import { MarketplaceResultsPagination } from "../../marketplace/components/MarketplaceResultsPagination";
import { Language, Post, ViewMode } from "../../../types";
import { APP_CONFIG } from "../../../constants/appConfig";
import { HomeHeroSection } from "../components/HomeHeroSection";
import { HomeCategoriesSection } from "../components/HomeCategoriesSection";
import { PostCarousel } from "../components/PostCarousel";
import { HomePromotionalBanner } from "../components/HomePromotionalBanner";
import { MarketplaceDiscoveryControls } from "../../marketplace/components/MarketplaceDiscoveryControls";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { PageShell } from "../../../shared/ui/page-shell";

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

  // Split posts for "Featured" carousel and main grid
  const featuredPosts = useMemo(() => {
    return displayedPosts.filter((p) => p.status !== "SOLD").slice(0, 10);
  }, [displayedPosts]);

  const recentPosts = useMemo(() => {
    return displayedPosts
      .filter((p) => p.status !== "SOLD")
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [displayedPosts]);

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
      />

      {/* 2. Categories - Circular icons */}
      <HomeCategoriesSection
        language={language}
        t={t}
        getCategoryTranslation={getCategoryTranslation}
        setSelectedCategoryForPage={setSelectedCategoryForPage}
        setShowAllPosts={setShowAllPosts}
      />

      {/* 3. Featured Items Carousel */}
      {!isLoadingPosts && featuredPosts.length > 0 && (
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
          tags={[
            { id: "1", label: language === "ar" ? "سيارات للبيع" : "Cars for Sale" },
            { id: "2", label: language === "ar" ? "سيارات للايجار" : "Cars for Rent" },
            { id: "3", label: language === "ar" ? "دراجات نارية" : "Motorcycles" },
            { id: "4", label: language === "ar" ? "صندوق" : "Box" },
            { id: "5", label: language === "ar" ? "أرقام لوحات" : "License Plates" },
            { id: "6", label: language === "ar" ? "جنوط" : "Rims" },
            { id: "7", label: language === "ar" ? "أضوية المركبة" : "Car Lights" },
          ]}
          activeTagId="1" // Mock active tag
        />
      )}

      {/* 4. Promotional Banner */}
      <HomePromotionalBanner
        title={language === "ar" ? "تسوّق بثقة وأمان" : "Shop with Confidence"}
        subtitle={
          language === "ar"
            ? "تحقق من التقييمات واتصل بالبائعين مباشرة"
            : "Verified reviews & direct seller communication"
        }
        buttonLabel={language === "ar" ? "ابدأ التسوق" : "Start Shopping"}
        onButtonClick={scrollToTop}
        icon={Star}
        variant="accent"
      />

      {/* 5. Recent Items Carousel */}
      {!isLoadingPosts && recentPosts.length > 0 && (
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
      )}

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {language === "ar" ? "جميع المنتجات" : "All Listings"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "ar"
                ? "تصفح جميع الإعلانات المتاحة"
                : "Browse all available listings"}
            </p>
          </div>
        </div>

        {/* View Controls */}
        <MarketplaceDiscoveryControls
          language={language}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="mb-8"
          showViewModeOnMobile
        />

        {/* Loading State */}
        {isLoadingPosts && (
          <div className="py-2.5">
            <PostResultsGridSkeleton
              viewMode={viewMode}
              count={12}
              hideCategoryBadge={false}
            />
          </div>
        )}

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
            onRequireAuth={() => setShowLoginPrompt(true)}
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
      </main>
    </PageShell>
  );
}

import { AlertCircle, Globe, WifiOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Language, Post } from "../../../types";
import type { Category } from "../../../types/api";
import { PostCarousel } from "./PostCarousel";
import { PostCarouselSkeleton } from "./PostCarouselSkeleton";
import { HomePromotionalBanner } from "./HomePromotionalBanner";
import { MarketplaceEmptyState } from "../../marketplace/components/MarketplaceEmptyState";
import { isActivePost } from "../../../lib/searchRanking";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";
import { useOnlineStatus } from "../../../shared/hooks/useOnlineStatus";
import { homeTranslations } from "../translations";

type CategorySection = {
  categoryName: string;
  displayName: string;
  posts: Post[];
};

function getViewCount(post: Post): number {
  return Number.isFinite(post.views) ? post.views ?? 0 : 0;
}

type HomeDeferredSectionsProps = {
  language: Language;
  isAuthenticated: boolean;
  isLoadingPosts: boolean;
  isLoadingCategories: boolean;
  postsError: string | null;
  retryPosts: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowLoginPrompt: (show: boolean) => void;
  setShowCreatePost: (show: boolean) => void;
  setShowAllPosts: (show: boolean, sortBy?: string) => void;
  setSelectedCategoryForPage: (category: string) => void;
  onPostClick: (id: string, origin?: string) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  currentUserId?: string;
  displayedPosts: Post[];
  availablePosts: Post[];
  filteredPosts: Post[];
  categories: Category[];
};

export function HomeDeferredSections({
  language,
  isAuthenticated,
  isLoadingPosts,
  isLoadingCategories,
  postsError = null,
  retryPosts,
  searchQuery = "",
  setSearchQuery,
  setShowLoginPrompt,
  setShowCreatePost,
  setShowAllPosts,
  setSelectedCategoryForPage,
  onPostClick,
  favoriteIds = [],
  toggleFavorite,
  currentUserId,
  displayedPosts = [],
  availablePosts = [],
  filteredPosts = [],
  categories = [],
}: HomeDeferredSectionsProps) {
  const isOnline = useOnlineStatus();
  const copy = homeTranslations[language];
  const [isRetrying, setIsRetrying] = useState(false);
  const safeDisplayedPosts = useMemo(
    () => (Array.isArray(displayedPosts) ? displayedPosts : []),
    [displayedPosts],
  );
  const safeAvailablePosts = useMemo(
    () => (Array.isArray(availablePosts) ? availablePosts : []),
    [availablePosts],
  );
  const safeFilteredPosts = useMemo(
    () => (Array.isArray(filteredPosts) ? filteredPosts : []),
    [filteredPosts],
  );
  const safeCategories = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );
  const safeFavoriteIds = useMemo(
    () => (Array.isArray(favoriteIds) ? favoriteIds : []),
    [favoriteIds],
  );

  const featuredPosts = useMemo(
    () => [...safeFilteredPosts]
      .filter(isActivePost)
      .sort((a, b) => getViewCount(b) - getViewCount(a))
      .slice(0, 10),
    [safeFilteredPosts],
  );

  const recentPosts = useMemo(() => {
    return safeDisplayedPosts
      .filter(isActivePost)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [safeDisplayedPosts]);

  const categorySections = useMemo<CategorySection[]>(() => {
    const postsByCategory = new Map<string, Post[]>();

    safeAvailablePosts
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

    return safeCategories.flatMap((category) => {
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
  }, [safeAvailablePosts, safeCategories, language]);

  const allListingsCarouselPosts = useMemo(() => {
    return [...safeFilteredPosts]
      .filter(isActivePost)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [safeFilteredPosts]);

  const hasRetainedPosts = safeAvailablePosts.some(isActivePost);
  const showFeedLoading = isLoadingPosts && isOnline;
  const showOfflineEmptyState = !isOnline && !hasRetainedPosts;
  const showServerErrorState =
    isOnline && !isLoadingPosts && Boolean(postsError) && !hasRetainedPosts;
  const hasBlockingFeedFailure =
    showOfflineEmptyState || showServerErrorState;

  const handleRetry = useCallback(async () => {
    if (isRetrying) {
      return;
    }

    if (!isOnline) {
      // TanStack Query resumes the queued feed request automatically when the
      // browser reports that connectivity has returned. Do not leave the CTA
      // in a permanent loading state while that request is paused.
      void retryPosts().catch(() => undefined);
      return;
    }

    setIsRetrying(true);
    try {
      await retryPosts();
    } finally {
      setIsRetrying(false);
    }
  }, [isOnline, isRetrying, retryPosts]);

  return (
    <>
      {!isOnline && hasRetainedPosts ? (
        <section
          aria-label={copy.offlineCachedNotice}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"
        >
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-center text-sm text-muted-foreground"
          >
            <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>{copy.offlineCachedNotice}</span>
          </div>
        </section>
      ) : null}

      {showFeedLoading ? (
        <PostCarouselSkeleton hasSubtitle />
      ) : featuredPosts.length > 0 ? (
        <PostCarousel
          title={language === "ar" ? "المنشورات المميزة" : "Featured Posts"}
          subtitle={
            language === "ar"
              ? "أبرز المنتجات المتوفرة حالياً"
              : "Top picks available right now"
          }
          posts={featuredPosts}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          favoriteIds={safeFavoriteIds}
          onFavoriteToggle={toggleFavorite}
          onPostClick={(id) => onPostClick(id, "featured")}
          onViewAll={() => setShowAllPosts(true, "views")}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}

      {showFeedLoading ? (
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
          favoriteIds={safeFavoriteIds}
          onFavoriteToggle={toggleFavorite}
          onPostClick={(id) => onPostClick(id, "recent")}
          onViewAll={() => setShowAllPosts(true, "date")}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}

      {!showFeedLoading && !isLoadingCategories
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
              favoriteIds={safeFavoriteIds}
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

      {!hasBlockingFeedFailure ? (
        <HomePromotionalBanner
          title={
            language === "ar"
              ? "بيع في كل مكان بالأردن"
              : "Sell Across All of Jordan"
          }
          subtitle={
            language === "ar"
              ? "اعرض منشوراتك ووصلها للمشترين في كل المحافظات"
              : "List your posts and reach buyers in every governorate"
          }
          buttonLabel={
            !isOnline
              ? undefined
              : isAuthenticated
                ? language === "ar"
                  ? "أضف إعلان"
                  : "Post a Listing"
                : language === "ar"
                  ? "سجل الآن"
                  : "Sign Up Now"
          }
          onButtonClick={
            !isOnline
              ? undefined
              : () =>
                  isAuthenticated
                    ? setShowCreatePost(true)
                    : setShowLoginPrompt(true)
          }
          icon={Globe}
          variant="gradient"
        />
      ) : null}

      <section
        id="home-marketplace-content"
        aria-label={language === "ar" ? "محتوى السوق" : "Marketplace content"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {showFeedLoading ? <PostCarouselSkeleton hasSubtitle /> : null}

        {showOfflineEmptyState ? (
          <MarketplaceEmptyState
            title={copy.offlineTitle}
            description={copy.offlineDescription}
            actionLabel={copy.retry}
            actionPendingLabel={copy.retrying}
            onAction={() => void handleRetry()}
            isActionPending={isRetrying}
            icon={WifiOff}
            liveRegion
            className="min-h-72 rounded-2xl border border-border bg-card"
          />
        ) : null}

        {showServerErrorState ? (
          <MarketplaceEmptyState
            title={copy.feedErrorTitle}
            description={copy.feedErrorDescription}
            actionLabel={copy.retry}
            actionPendingLabel={copy.retrying}
            onAction={() => void handleRetry()}
            isActionPending={isRetrying}
            icon={AlertCircle}
            liveRegion
            className="min-h-72 rounded-2xl border border-border bg-card"
          />
        ) : null}

        {!showFeedLoading &&
        !showOfflineEmptyState &&
        !showServerErrorState &&
        allListingsCarouselPosts.length > 0 ? (
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
            favoriteIds={safeFavoriteIds}
            onFavoriteToggle={toggleFavorite}
            onPostClick={(id) => onPostClick(id, "marketplace")}
            onViewAll={() => setShowAllPosts(true)}
            viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
            onRequireAuth={() => setShowLoginPrompt(true)}
          />
        ) : null}

        {!showFeedLoading &&
        !showOfflineEmptyState &&
        !showServerErrorState &&
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
      </section>
    </>
  );
}

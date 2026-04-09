import { Globe } from "lucide-react";
import { useMemo } from "react";
import type { Language, Post } from "../../../types";
import type { Category } from "../../../types/api";
import { PostCarousel } from "./PostCarousel";
import { PostCarouselSkeleton } from "./PostCarouselSkeleton";
import { HomePromotionalBanner } from "./HomePromotionalBanner";
import { MarketplaceEmptyState } from "../../marketplace/components/MarketplaceEmptyState";
import { isActivePost } from "../../../lib/searchRanking";
import { resolveCategoryName } from "../../../shared/lib/categoryVisuals";

type CategorySection = {
  categoryName: string;
  displayName: string;
  posts: Post[];
};

type HomeDeferredSectionsProps = {
  language: Language;
  isAuthenticated: boolean;
  isLoadingPosts: boolean;
  isLoadingCategories: boolean;
  postsError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowLoginPrompt: (show: boolean) => void;
  setShowCreatePost: (show: boolean) => void;
  setShowAllPosts: (show: boolean) => void;
  setSelectedCategoryForPage: (category: string) => void;
  onPostClick: (id: string, origin?: string) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  currentUserId?: string;
  displayedPosts: Post[];
  availablePosts: Post[];
  filteredPosts: Post[];
  categories: Category[];
  backendUrlHint: string;
};

export function HomeDeferredSections({
  language,
  isAuthenticated,
  isLoadingPosts,
  isLoadingCategories,
  postsError = null,
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
  backendUrlHint,
}: HomeDeferredSectionsProps) {
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
    () => [...safeDisplayedPosts]
      .filter((p) => p.status !== "SOLD")
      .slice(0, 10),
    [safeDisplayedPosts],
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

  return (
    <>
      {isLoadingPosts ? (
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
          onViewAll={() => setShowAllPosts(true)}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}

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
          favoriteIds={safeFavoriteIds}
          onFavoriteToggle={toggleFavorite}
          onPostClick={(id) => onPostClick(id, "recent")}
          onViewAll={() => setShowAllPosts(true)}
          viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
          onRequireAuth={() => setShowLoginPrompt(true)}
        />
      ) : null}

      {!isLoadingPosts && !isLoadingCategories
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
          isAuthenticated
            ? language === "ar"
              ? "أضف إعلان"
              : "Post a Listing"
            : language === "ar"
              ? "سجل الآن"
              : "Sign Up Now"
        }
        onButtonClick={() =>
          isAuthenticated ? setShowCreatePost(true) : setShowLoginPrompt(true)
        }
        icon={Globe}
        variant="gradient"
      />

      <section
        id="home-marketplace-content"
        aria-label={language === "ar" ? "محتوى السوق" : "Marketplace content"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {isLoadingPosts ? <PostCarouselSkeleton hasSubtitle /> : null}

        {!isLoadingPosts && postsError && (
          <div className="col-span-full mb-4 flex flex-col items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-8 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-center text-sm text-yellow-800 dark:text-yellow-200">
              {postsError}
            </p>
            {postsError.includes("Cannot connect") && (
              <p className="mt-2 text-center text-xs text-yellow-700 dark:text-yellow-300">
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
            favoriteIds={safeFavoriteIds}
            onFavoriteToggle={toggleFavorite}
            onPostClick={(id) => onPostClick(id, "marketplace")}
            onViewAll={() => setShowAllPosts(true)}
            viewAllLabel={language === "ar" ? "عرض الكل" : "View All"}
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
      </section>
    </>
  );
}

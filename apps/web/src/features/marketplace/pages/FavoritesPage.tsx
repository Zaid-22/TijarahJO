import { useMemo } from "react";
import { PostResultsGrid } from "../components/PostResultsGrid";
import { PostResultsGridSkeleton } from "../components/PostResultsGridSkeleton";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import { Heart } from "lucide-react";
import { api } from "../../../services/api";
import { useServerQuery } from "../../../shared/hooks/useServerQuery";

interface FavoritesPageProps {
  onBackToMarketplace: () => void;
  favoriteIds: string[];
  posts: Post[];
  onRemoveFavorite: (postId: string) => void;
  onPostClick: (postId: string) => void;
  language: Language;
  isAuthenticated?: boolean;
  currentUserId?: string;
  onRequireAuth?: () => void;
}

export function FavoritesPage({
  onBackToMarketplace,
  favoriteIds,
  posts,
  onRemoveFavorite,
  onPostClick,
  language,
  isAuthenticated = false,
  currentUserId,
  onRequireAuth,
}: FavoritesPageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const feedFavoritePosts = useMemo(
    () => posts.filter((post) => favoriteIdSet.has(post.id)),
    [favoriteIdSet, posts],
  );
  const hydratedFavoriteIds = useMemo(
    () => new Set(feedFavoritePosts.map((post) => post.id)),
    [feedFavoritePosts],
  );
  const missingFavoriteIds = useMemo(
    () => favoriteIds.filter((favoriteId) => !hydratedFavoriteIds.has(favoriteId)),
    [favoriteIds, hydratedFavoriteIds],
  );
  const favoritesPostsCacheKey = useMemo(
    () => `favorites:posts:${missingFavoriteIds.slice().sort().join(",")}`,
    [missingFavoriteIds],
  );

  const {
    data: missingFavoritePosts,
    isLoading: isLoadingMissingFavoritePosts,
    isFetching: isFetchingMissingFavoritePosts,
  } = useServerQuery<Post[]>({
    key: favoritesPostsCacheKey,
    tags: ["favorites", "posts"],
    enabled: missingFavoriteIds.length > 0,
    staleTimeMs: 30_000,
    retryCount: 1,
    retryDelayMs: 600,
    queryFn: async () => {
      const resolvedPosts = await Promise.all(
        missingFavoriteIds.map((favoriteId) => api.posts.getPost(favoriteId)),
      );
      return resolvedPosts.filter((post): post is Post => post !== null);
    },
  });

  const favoritePosts = useMemo(() => {
    const mergedPosts = [...feedFavoritePosts];
    const mergedIds = new Set(mergedPosts.map((post) => post.id));

    for (const post of missingFavoritePosts || []) {
      if (!favoriteIdSet.has(post.id) || mergedIds.has(post.id)) {
        continue;
      }

      mergedPosts.push(post);
      mergedIds.add(post.id);
    }

    return mergedPosts;
  }, [favoriteIdSet, feedFavoritePosts, missingFavoritePosts]);

  const isResolvingFavoritePosts =
    favoriteIds.length > 0 &&
    favoritePosts.length === 0 &&
    (isLoadingMissingFavoritePosts || isFetchingMissingFavoritePosts);

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBackToMarketplace}
        isRTL={isRTL}
        backLabel={t.backToListings}
        showLogo={true}
        onLogoClick={onBackToMarketplace}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
              <Heart className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-foreground">
                {t.favorites}
              </h1>
            </div>
          </div>
        </div>

        {isResolvingFavoritePosts ? (
          <PostResultsGridSkeleton
            viewMode="list"
            count={Math.min(Math.max(favoriteIds.length, 1), 3)}
          />
        ) : (
          <PostResultsGrid
            posts={favoritePosts}
            viewMode="list"
            onPostClick={onPostClick}
            favoriteIds={favoriteIds}
            onFavoriteToggle={onRemoveFavorite}
            isAuthenticated={isAuthenticated}
            currentUserId={isAuthenticated ? currentUserId : undefined}
            language={language}
            onRequireAuth={onRequireAuth}
            emptyState={{
              title: t.noFavorites,
              description: t.noFavoritesDescription,
              actionLabel: t.browseListing,
              onAction: onBackToMarketplace,
            }}
          />
        )}
      </div>

    </PageShell>
  );
}

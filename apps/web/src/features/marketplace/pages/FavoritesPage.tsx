import { PostResultsGrid } from "../components/PostResultsGrid";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import { Heart } from "lucide-react";

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

  const favoritePosts = posts.filter((p) => favoriteIds.includes(p.id));

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

        <PostResultsGrid
          posts={favoritePosts}
          viewMode="grid-4"
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
      </div>

    </PageShell>
  );
}

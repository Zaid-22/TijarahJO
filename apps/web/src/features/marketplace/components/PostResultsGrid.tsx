import { useMemo } from "react";
import { PostCard } from "./PostCard";
import { MarketplaceEmptyState } from "./MarketplaceEmptyState";
import { cn } from "../../../shared/ui/utils";
import { getViewModeGridClass } from "../../../shared/lib/viewModeGrid";
import type { Language, Post, ViewMode } from "../../../types";

interface PostResultsEmptyState {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface PostResultsGridProps {
  posts: Post[];
  viewMode: ViewMode;
  onPostClick: (id: string) => void;
  favoriteIds: string[];
  onFavoriteToggle: (id: string) => void;
  language: Language;
  emptyState: PostResultsEmptyState;
  isAuthenticated?: boolean;
  currentUserId?: string;
  currentUserDisplayName?: string;
  hideCategoryBadge?: boolean;
  animated?: boolean;
  className?: string;
  onRequireAuth?: () => void;
}

function resolvePostKey(post: Post, index: number) {
  if (post.id) {
    return post.id;
  }

  return `post-fallback-${String(post.name || "item")
    .trim()
    .toLowerCase()}-${String(post.sellerId || post.seller || "unknown")
    .trim()
    .toLowerCase()}-${String(post.createdAt || "created")}-${index}`;
}

export function PostResultsGrid({
  posts,
  viewMode,
  onPostClick,
  favoriteIds,
  onFavoriteToggle,
  language,
  emptyState,
  isAuthenticated = false,
  currentUserId,
  currentUserDisplayName,
  hideCategoryBadge = false,
  animated = false,
  className,
  onRequireAuth,
}: PostResultsGridProps) {
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 md:gap-6",
        getViewModeGridClass(viewMode),
        animated && "transition-all duration-300",
        className,
      )}
    >
      {posts.length === 0 ? (
        <MarketplaceEmptyState
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
        />
      ) : (
        posts.map((post, index) => (
          <PostCard
            key={resolvePostKey(post, index)}
            post={post}
            onPostClick={onPostClick}
            viewMode={viewMode}
            isFavorite={favoriteIdSet.has(post.id)}
            onFavoriteToggle={onFavoriteToggle}
            isAuthenticated={isAuthenticated}
            currentUserId={isAuthenticated ? currentUserId : undefined}
            currentUserDisplayName={isAuthenticated ? currentUserDisplayName : undefined}
            hideCategoryBadge={hideCategoryBadge}
            language={language}
            onRequireAuth={onRequireAuth}
          />
        ))
      )}
    </div>
  );
}

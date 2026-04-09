import { PostCard } from "../../marketplace/components/PostCard";
import type { Language } from "../../../translations";
import type { Post, ViewMode } from "../../../types";
import type { UnifiedProfileLabels } from "./unifiedProfileLabels";

interface UnifiedProfileListingCardProps {
  post: Post;
  allowManage: boolean;
  listingViewMode: ViewMode;
  language: Language;
  favoriteIds: string[];
  isAuthenticated: boolean;
  currentUserId?: string;
  onFavoriteToggle?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  labels: UnifiedProfileLabels;
}

export function UnifiedProfileListingCard({
  post,
  listingViewMode,
  language,
  favoriteIds,
  isAuthenticated,
  currentUserId,
  onFavoriteToggle,
  onPostClick,
}: UnifiedProfileListingCardProps) {
  return (
    <PostCard
      post={post}
      viewMode={listingViewMode}
      onPostClick={onPostClick}
      isFavorite={favoriteIds.includes(post.id)}
      onFavoriteToggle={onFavoriteToggle}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUserId}
      language={language}
    />
  );
}

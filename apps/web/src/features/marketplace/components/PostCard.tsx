import type { Language, Post } from "../../../types";
import { PostCardGrid } from "./PostCardGrid";
import { PostCardList } from "./PostCardList";

interface PostCardProps {
  post: Post;
  onPostClick?: (postId: string) => void;
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
  isFavorite?: boolean;
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string;
  currentUserId?: string;
  hideCategoryBadge?: boolean;
  language?: Language;
}

export function PostCard({
  viewMode = "grid-4",
  currentUserDisplayName: _currentUserDisplayName,
  ...sharedProps
}: PostCardProps) {
  return viewMode === "list" ? (
    <PostCardList {...sharedProps} />
  ) : (
    <PostCardGrid {...sharedProps} />
  );
}

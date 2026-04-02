import { Edit, Package, Trash2, type LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "../../../shared/ui/button";
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
  currentUserDisplayName?: string;
  onFavoriteToggle?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  labels: UnifiedProfileLabels;
}

interface ActionButtonProps {
  icon: LucideIcon;
  title: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  danger?: boolean;
}

function ActionButton({
  icon: Icon,
  title,
  onClick,
  danger = false,
}: ActionButtonProps) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={`h-9 w-9 rounded-xl bg-background/90 p-0 shadow-md backdrop-blur-sm ${
        danger ? "hover:bg-destructive/10" : "hover:bg-muted"
      }`}
      onClick={onClick}
      title={title}
    >
      <Icon
        className={`h-4 w-4 ${danger ? "text-destructive" : "text-primary"}`}
      />
    </Button>
  );
}

export function UnifiedProfileListingCard({
  post,
  allowManage,
  listingViewMode,
  language,
  favoriteIds,
  isAuthenticated,
  currentUserId,
  currentUserDisplayName,
  onFavoriteToggle,
  onPostClick,
  onEditPost,
  onDeletePost,
  labels,
}: UnifiedProfileListingCardProps) {
  return (
    <div key={post.id} className="group relative">
      <PostCard
        post={post}
        viewMode={listingViewMode}
        onPostClick={onPostClick}
        isFavorite={favoriteIds.includes(post.id)}
        onFavoriteToggle={onFavoriteToggle}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        currentUserDisplayName={currentUserDisplayName}
        language={language}
      />

      {allowManage ? (
        <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {onPostClick ? (
            <ActionButton
              icon={Package}
              title={labels.viewPost}
              onClick={(event) => {
                event.stopPropagation();
                onPostClick(post.id);
              }}
            />
          ) : null}

          {onEditPost ? (
            <ActionButton
              icon={Edit}
              title={labels.editPost}
              onClick={(event) => {
                event.stopPropagation();
                onEditPost(post);
              }}
            />
          ) : null}

          {onDeletePost ? (
            <ActionButton
              icon={Trash2}
              title={labels.deletePost}
              danger
              onClick={(event) => {
                event.stopPropagation();
                onDeletePost(post.id);
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

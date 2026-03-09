import { useMemo } from "react";
import { PostCarousel } from "../home/components/PostCarousel";
import type { Language, Post } from "../../types";

interface SimilarItemsSectionProps {
  currentPost: Post;
  allPosts?: Post[];
  language: Language;
  isAuthenticated?: boolean;
  currentUserId?: string;
  currentUserDisplayName?: string;
  favoriteIds?: string[];
  onFavoriteToggle?: (id: string) => void;
  onPostClick?: (id: string) => void;
}

export function SimilarItemsSection({
  currentPost,
  allPosts = [],
  language,
  isAuthenticated = false,
  currentUserId,
  currentUserDisplayName,
  favoriteIds = [],
  onFavoriteToggle,
  onPostClick,
}: SimilarItemsSectionProps) {
  const similarItems = useMemo(() => {
    return allPosts
      .filter(
        (p) =>
          p.id !== currentPost.id &&
          p.status !== "SOLD" &&
          p.status !== "DELETED" &&
          (p.category === currentPost.category ||
            p.location === currentPost.location),
      )
      .slice(0, 12);
  }, [allPosts, currentPost]);

  const moreFromSeller = useMemo(() => {
    if (!currentPost.sellerId) return [];
    return allPosts
      .filter(
        (p) =>
          p.id !== currentPost.id &&
          p.sellerId === currentPost.sellerId &&
          p.status !== "SOLD" &&
          p.status !== "DELETED",
      )
      .slice(0, 8);
  }, [allPosts, currentPost]);

  if (similarItems.length === 0 && moreFromSeller.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border mt-8">
      {moreFromSeller.length > 0 && (
        <PostCarousel
          title={
            language === "ar" ? "المزيد من هذا البائع" : "More from this Seller"
          }
          posts={moreFromSeller}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          favoriteIds={favoriteIds}
          onFavoriteToggle={onFavoriteToggle}
          onPostClick={(id: string) => onPostClick?.(id)}
        />
      )}

      {similarItems.length > 0 && (
        <PostCarousel
          title={language === "ar" ? "منتجات مشابهة" : "Similar Items"}
          subtitle={
            language === "ar"
              ? "بناءً على الفئة والموقع"
              : "Based on category and location"
          }
          posts={similarItems}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          favoriteIds={favoriteIds}
          onFavoriteToggle={onFavoriteToggle}
          onPostClick={(id: string) => onPostClick?.(id)}
        />
      )}
    </div>
  );
}

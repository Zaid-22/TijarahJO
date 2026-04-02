import { useMemo } from "react";
import { PostCarousel } from "../home/components/PostCarousel";
import type { Language, Post } from "../../types";
import { api } from "../../services/api";
import { useServerQuery } from "../../shared/hooks/useServerQuery";

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
  onRequireAuth?: () => void;
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
  onRequireAuth,
}: SimilarItemsSectionProps) {
  const { data: fallbackFeedPosts = [] } = useServerQuery<Post[]>({
    key: "posts:feed",
    tags: ["posts", "posts-feed"],
    enabled: allPosts.length === 0,
    staleTimeMs: 45_000,
    retryCount: 1,
    retryDelayMs: 700,
    refetchOnReconnect: true,
    queryFn: async ({ signal }) => {
      const response = await api.posts.getPosts(undefined, {
        signal,
        throwOnAbort: true,
      });

      if (response.success && response.posts) {
        return response.posts;
      }

      throw new Error(response.error?.message || "Failed to load posts");
    },
  });

  const { data: sellerPosts = [] } = useServerQuery<Post[]>({
    key: `posts:seller:${String(currentPost.sellerId || "").trim()}`,
    tags: ["posts", "seller-posts"],
    enabled: Boolean(currentPost.sellerId),
    staleTimeMs: 45_000,
    retryCount: 1,
    retryDelayMs: 700,
    refetchOnReconnect: true,
    queryFn: async () =>
      api.posts.getUserPosts(String(currentPost.sellerId || "").trim()),
  });

  const sourcePosts = allPosts.length > 0 ? allPosts : fallbackFeedPosts;

  const moreFromSeller = useMemo(() => {
    if (!currentPost.sellerId) return [];

    const sellerPostPool =
      sellerPosts.length > 0 ? sellerPosts : sourcePosts;

    return sellerPostPool
      .filter(
        (p) =>
          p.id !== currentPost.id &&
          p.sellerId === currentPost.sellerId &&
          p.status !== "SOLD" &&
          p.status !== "DELETED",
      )
      .slice(0, 8);
  }, [currentPost, sellerPosts, sourcePosts]);

  const moreFromSellerIds = useMemo(
    () => new Set(moreFromSeller.map((post) => post.id)),
    [moreFromSeller],
  );

  const similarPosts = useMemo(() => {
    return sourcePosts
      .filter(
        (p) =>
          p.id !== currentPost.id &&
          !moreFromSellerIds.has(p.id) &&
          p.status !== "SOLD" &&
          p.status !== "DELETED" &&
          (p.category === currentPost.category ||
            p.location === currentPost.location),
      )
      .slice(0, 12);
  }, [sourcePosts, currentPost, moreFromSellerIds]);

  if (similarPosts.length === 0 && moreFromSeller.length === 0) {
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
          onRequireAuth={onRequireAuth}
        />
      )}

      {similarPosts.length > 0 && (
        <PostCarousel
          title={language === "ar" ? "منشورات مشابهة" : "Similar Posts"}
          subtitle={
            language === "ar"
              ? "بناءً على الفئة والموقع"
              : "Based on category and location"
          }
          posts={similarPosts}
          language={language}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          currentUserDisplayName={currentUserDisplayName}
          favoriteIds={favoriteIds}
          onFavoriteToggle={onFavoriteToggle}
          onPostClick={(id: string) => onPostClick?.(id)}
          onRequireAuth={onRequireAuth}
        />
      )}
    </div>
  );
}

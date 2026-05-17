import { useId } from "react";
import { PostCard } from "../../marketplace/components/PostCard";
import type { Language, Post } from "../../../types";
import { cn } from "../../../shared/ui/utils";

interface PostCarouselTag {
  id: string;
  label: string;
}

interface PostCarouselProps {
  title: string;
  subtitle?: string;
  posts: Post[];
  language: Language;
  isAuthenticated?: boolean;
  currentUserId?: string;
  favoriteIds?: string[];
  onFavoriteToggle?: (id: string) => void;
  onPostClick: (id: string) => void;
  onViewAll?: () => void;
  viewAllLabel?: string;
  onRequireAuth?: () => void;
  tags?: PostCarouselTag[];
  activeTagId?: string;
  onTagClick?: (id: string) => void;
}

export function PostCarousel({
  title,
  subtitle,
  posts,
  language,
  isAuthenticated = false,
  currentUserId,
  favoriteIds = [],
  onFavoriteToggle,
  onPostClick,
  onViewAll,
  viewAllLabel,
  onRequireAuth,
  tags,
  activeTagId,
  onTagClick,
}: PostCarouselProps) {
  const isRTL = language === "ar";
  const headingId = useId();
  const descriptionId = useId();

  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={subtitle ? descriptionId : undefined}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            id={headingId}
            className="text-xl sm:text-2xl font-bold text-foreground"
          >
            {title}
          </h2>
          {subtitle && (
            <p
              id={descriptionId}
              className="text-sm text-muted-foreground mt-1"
            >
              {subtitle}
            </p>
          )}
        </div>
        {onViewAll && viewAllLabel && (
          <button
            type="button"
            onClick={onViewAll}
            className="group flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
          >
            <span>{viewAllLabel}</span>
            <svg
              className={`h-4 w-4 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {tags && tags.length > 0 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-none mb-6 pb-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagClick?.(tag.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl whitespace-nowrap text-sm sm:text-base font-semibold transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                activeTagId === tag.id
                  ? "bg-muted text-foreground border-transparent shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 border-transparent shadow-none",
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}

      {/* Carousel */}
      <div className="relative group/carousel">
        <div
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="w-[282px] shrink-0 snap-start sm:w-[300px] md:w-[320px]"
            >
              <PostCard
                post={post}
                onPostClick={onPostClick}
                viewMode="grid-4"
                isFavorite={favoriteIds.includes(post.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                language={language}
                onRequireAuth={onRequireAuth}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

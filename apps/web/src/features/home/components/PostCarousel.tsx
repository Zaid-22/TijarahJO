import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PostCard } from "../../marketplace/components/PostCard";
import type { Language, Post } from "../../../types";
import { cn } from "../../../shared/ui/utils";

export interface PostCarouselTag {
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
  currentUserDisplayName?: string;
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
  currentUserDisplayName,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 4;
    if (isRTL) {
      setCanScrollRight(el.scrollLeft < -threshold);
      setCanScrollLeft(
        el.scrollLeft > -(el.scrollWidth - el.clientWidth) + threshold,
      );
    } else {
      setCanScrollLeft(el.scrollLeft > threshold);
      setCanScrollRight(
        el.scrollLeft < el.scrollWidth - el.clientWidth - threshold,
      );
    }
  }, [isRTL]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, posts.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {onViewAll && viewAllLabel && (
          <button
            type="button"
            onClick={onViewAll}
            className="group text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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
                "px-5 py-2.5 rounded-xl whitespace-nowrap text-sm sm:text-[15px] font-semibold transition-all duration-200 border",
                activeTagId === tag.id
                  ? "bg-muted text-foreground border-transparent shadow-sm"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 border-transparent shadow-none"
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}

      {/* Carousel */}
      <div className="relative group/carousel">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-1/2"
            aria-label={language === "ar" ? "التمرير لليسار" : "Scroll left"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-1/2"
            aria-label={language === "ar" ? "التمرير لليمين" : "Scroll right"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px] snap-start"
            >
              <PostCard
                post={post}
                onPostClick={onPostClick}
                viewMode="grid-4"
                isFavorite={favoriteIds.includes(post.id)}
                onFavoriteToggle={onFavoriteToggle}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                currentUserDisplayName={currentUserDisplayName}
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

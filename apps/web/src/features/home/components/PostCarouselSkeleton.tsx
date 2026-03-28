import { PostCardSkeleton } from "../../marketplace/components/PostCardSkeleton";

interface PostCarouselSkeletonProps {
  hasSubtitle?: boolean;
}

export function PostCarouselSkeleton({ hasSubtitle = true }: PostCarouselSkeletonProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-6 sm:h-8 w-48 sm:w-64 bg-muted animate-pulse rounded-md" />
          {hasSubtitle && (
            <div className="h-4 w-64 sm:w-80 bg-muted animate-pulse rounded-md mt-2" />
          )}
        </div>
      </div>

      {/* Carousel Skeleton */}
      <div className="flex gap-4 sm:gap-5 overflow-hidden pb-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`post-skeleton-${index}`}
            className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px]"
          >
            <PostCardSkeleton viewMode="grid-4" />
          </div>
        ))}
      </div>
    </section>
  );
}

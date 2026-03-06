import { cn } from "./utils";
import { getViewModeGridClass } from "../lib/viewModeGrid";
import type { ViewMode } from "../../types";

interface PostCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder matching the PostCard grid-view dimensions.
 * Uses `animate-pulse` for a subtle shimmer while posts are loading.
 */
export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card animate-pulse",
        className,
      )}
      aria-hidden="true"
    >
      {/* Image placeholder — 4:3 aspect ratio matching PostCard */}
      <div className="w-full aspect-[4/3] bg-muted" />

      {/* Content placeholder */}
      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
        <div className="mb-3 sm:mb-4 flex-grow space-y-3">
          {/* Title */}
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />

          {/* Location row */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>

          {/* Seller row */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>

        {/* Price + button row */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2 sm:pt-3">
          <div className="h-6 w-20 rounded bg-muted" />
          <div className="h-8 w-16 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}

interface PostGridSkeletonProps {
  count?: number;
  viewMode?: ViewMode;
  className?: string;
}

/**
 * Renders a grid of skeleton cards matching the PostResultsGrid layout.
 * Use this as the loading state for marketplace grids.
 */
export function PostGridSkeleton({
  count = 8,
  viewMode = "grid-4",
  className,
}: PostGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 md:gap-6",
        getViewModeGridClass(viewMode),
        className,
      )}
      role="status"
      aria-label="Loading posts"
    >
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

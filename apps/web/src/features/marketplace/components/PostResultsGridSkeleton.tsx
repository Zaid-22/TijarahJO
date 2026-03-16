import { PostCardSkeleton } from "./PostCardSkeleton";
import { cn } from "../../../shared/ui/utils";
import { getViewModeGridClass } from "../../../shared/lib/viewModeGrid";
import type { ViewMode } from "../../../types";

interface PostResultsGridSkeletonProps {
  viewMode: ViewMode;
  count?: number;
  hideCategoryBadge?: boolean;
  className?: string;
}

export function PostResultsGridSkeleton({
  viewMode,
  count = 8,
  hideCategoryBadge = false,
  className,
}: PostResultsGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 md:gap-6",
        getViewModeGridClass(viewMode),
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton
          key={`skeleton-${i}`}
          viewMode={viewMode}
          hideCategoryBadge={hideCategoryBadge}
        />
      ))}
    </div>
  );
}

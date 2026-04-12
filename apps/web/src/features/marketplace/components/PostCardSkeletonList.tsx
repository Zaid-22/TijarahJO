import React from "react";
import { Skeleton } from "../../../shared/ui/skeleton";

interface PostCardSkeletonListProps {
  hideCategoryBadge?: boolean;
}

export const PostCardSkeletonList = React.memo(
  function PostCardSkeletonList({ hideCategoryBadge }: PostCardSkeletonListProps) {
    return (
      <article className="relative flex flex-col overflow-hidden rounded-[14px] bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/5 sm:flex-row sm:h-[220px]">
        {/* Image Area */}
        <div className="pointer-events-none relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted/30 sm:w-[220px] sm:aspect-auto xl:w-[240px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          
          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {!hideCategoryBadge && (
                <Skeleton className="h-5 w-16 rounded-full bg-background/50 shadow-sm backdrop-blur-md" />
              )}
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <Skeleton className="h-8 w-8 rounded-full bg-background/50 shadow-sm backdrop-blur-md" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 sm:h-6" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4 hidden sm:block" />
              <Skeleton className="h-4 w-1/2 hidden sm:block" />
            </div>

            <div className="hidden sm:flex gap-1.5 shrink-0">
              <Skeleton className="h-9 w-9 rounded-full bg-muted/50" />
              <Skeleton className="h-9 w-9 rounded-full bg-muted/50" />
            </div>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-6 w-24 rounded-md" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 flex-1 sm:w-28 rounded-md" />
              <Skeleton className="h-9 flex-1 sm:w-28 rounded-md" />
            </div>
          </div>
        </div>
      </article>
    );
  }
);

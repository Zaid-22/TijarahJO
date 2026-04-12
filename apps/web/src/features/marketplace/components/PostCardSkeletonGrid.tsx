import React from "react";
import { CardContent } from "../../../shared/ui/card";
import { Skeleton } from "../../../shared/ui/skeleton";

interface PostCardSkeletonGridProps {
  hideCategoryBadge?: boolean;
  language?: string;
}

export const PostCardSkeletonGrid = React.memo(
  function PostCardSkeletonGrid({ hideCategoryBadge }: PostCardSkeletonGridProps) {
    return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] bg-card shadow-md ring-1 ring-black/5 dark:ring-white/5">
        <div className="pointer-events-none relative aspect-[4/5] w-full overflow-hidden bg-muted/30">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />

          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {!hideCategoryBadge && (
                <Skeleton className="h-5 w-16 rounded-full bg-background/50 shadow-sm backdrop-blur-md" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-8 rounded-full bg-background/50 shadow-sm backdrop-blur-md" />
              <Skeleton className="h-8 w-8 rounded-full bg-background/50 shadow-sm backdrop-blur-md" />
            </div>
          </div>
        </div>

        <CardContent className="pointer-events-none relative z-20 flex flex-grow flex-col gap-2 px-2.5 pb-2.5 pt-2.5 sm:px-3 sm:pb-3">
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-4 w-4/5 sm:h-4" />
            <div className="flex items-center gap-1.5 mt-2">
              <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </CardContent>
      </article>
    );
  }
);

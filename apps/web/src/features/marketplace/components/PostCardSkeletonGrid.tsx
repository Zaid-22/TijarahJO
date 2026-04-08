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
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card shadow-sm sm:shadow-md">
        <div className="px-3 pt-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] border border-border/40 bg-muted/30 shadow-lg">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />

            <div className="absolute bottom-2.5 right-2.5 z-10">
              <Skeleton className="h-11 w-24 rounded-full bg-background/70" />
            </div>
          </div>

          {!hideCategoryBadge && (
            <div className="absolute top-3 left-3 z-10">
              <Skeleton className="h-6 w-20 rounded-full bg-background/50" />
            </div>
          )}
        </div>

        {/* Favorite Button Skeleton */}
        <div className="absolute right-5 top-5 z-20">
          <Skeleton className="h-9 w-9 rounded-[18px] bg-background/70" />
        </div>

        <CardContent className="flex flex-grow flex-col px-4 pb-4 pt-3.5 sm:px-4.5 sm:pb-4.5 sm:pt-3.5">
          <div className="flex-grow space-y-1">
            <Skeleton className="mb-2 h-5 w-10/12 sm:h-6" />
            <Skeleton className="mb-3 h-5 w-7/12 sm:h-6" />

            <Skeleton className="h-4 w-5/12" />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    );
  }
);

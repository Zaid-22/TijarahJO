import React from "react";
import { Skeleton } from "../../../shared/ui/skeleton";

interface PostCardSkeletonListProps {
  hideCategoryBadge?: boolean;
}

export const PostCardSkeletonList = React.memo(
  function PostCardSkeletonList({ hideCategoryBadge }: PostCardSkeletonListProps) {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row shadow-sm">
        <div className="relative w-full sm:w-64 aspect-square flex-shrink-0">
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          
          {!hideCategoryBadge && (
            <div className="absolute top-3 left-3 z-10">
              <Skeleton className="h-7 w-24 rounded-md bg-background/50" />
            </div>
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 w-full">
                {/* Title */}
                <Skeleton className="h-6 sm:h-7 w-3/4 mb-4" />
                
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 sm:h-5 w-32" />
                  </div>
                  
                  {/* Seller & Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 sm:h-5 w-24" />
                    </div>
                    <Skeleton className="h-5 sm:h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Favorite Button */}
              <div className="flex-shrink-0">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-8 sm:h-9 w-28" />
                <Skeleton className="h-5 sm:h-6 w-10" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-full" />
              <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-full" />
              <Skeleton className="h-10 sm:h-11 w-24 sm:w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

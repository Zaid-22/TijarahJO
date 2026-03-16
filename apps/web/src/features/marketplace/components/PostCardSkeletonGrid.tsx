import React from "react";
import { CardContent } from "../../../shared/ui/card";
import { Skeleton } from "../../../shared/ui/skeleton";
import { cn } from "../../../shared/ui/utils";

interface PostCardSkeletonGridProps {
  hideCategoryBadge?: boolean;
  language?: string;
}

export const PostCardSkeletonGrid = React.memo(
  function PostCardSkeletonGrid({ hideCategoryBadge, language = "en" }: PostCardSkeletonGridProps) {
    const isRTL = language === "ar";
    
    return (
      <div className="relative flex h-[380px] sm:h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative w-full overflow-hidden flex-shrink-0 aspect-[4/3]">
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          
          {!hideCategoryBadge && (
            <div className="absolute top-3 left-3 z-10">
              <Skeleton className="h-6 w-20 rounded-full bg-background/50" />
            </div>
          )}
        </div>

        {/* Favorite Button Skeleton */}
        <div className="absolute top-3 right-3 z-20">
          <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/50" />
        </div>

        <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
          <div className="mb-3 sm:mb-4 flex-grow">
            {/* Title */}
            <Skeleton className="h-5 sm:h-6 w-11/12 mb-2" />
            <Skeleton className="h-5 sm:h-6 w-8/12 mb-4" />
            
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex-shrink-0" />
                <Skeleton className="h-3 sm:h-4 w-5/12" />
              </div>
              
              {/* Seller */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-1/2">
                  <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex-shrink-0" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                </div>
                {/* Rating */}
                <Skeleton className="h-4 sm:h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-2 sm:pt-3">
            {/* Price */}
            <div className={cn("flex-1 min-w-0", isRTL ? "ml-2" : "mr-2")}>
              <div className="flex items-baseline gap-1">
                <Skeleton className="h-6 sm:h-7 w-20" />
                <Skeleton className="h-4 sm:h-5 w-8" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full" />
              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </div>
    );
  }
);

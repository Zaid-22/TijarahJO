import React from "react";
import { CardContent } from "../../../shared/ui/card";
import { Skeleton } from "../../../shared/ui/skeleton";
import { postCardMediaClass } from "./postCardMediaClass";

interface PostCardSkeletonGridProps {
  hideCategoryBadge?: boolean;
  language?: string;
}

export const PostCardSkeletonGrid = React.memo(
  function PostCardSkeletonGrid({ hideCategoryBadge }: PostCardSkeletonGridProps) {
    return (
      <article className="group relative flex flex-col overflow-hidden rounded-[14px] bg-card shadow-md ring-1 ring-black/5 dark:ring-white/5">
        <div
          className={
            postCardMediaClass +
            " pointer-events-none relative aspect-4/5 overflow-hidden bg-muted/30"
          }
        >
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0)_42%,rgba(15,23,42,0.22)_100%)]" />

          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {!hideCategoryBadge && (
                <Skeleton className="h-5 w-16 rounded-full bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-950/45" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-8 rounded-full bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-950/45" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-950/45" />
            </div>
          </div>
        </div>

        <CardContent className="pointer-events-none relative z-20 flex flex-col gap-2 px-2.5 pb-2.5 pt-2.5 sm:px-3 sm:pb-3">
          <div className="space-y-1">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md sm:h-6" />
            <Skeleton className="h-5 w-2/3 rounded-md sm:h-6" />
            <Skeleton className="h-3 w-3/5 rounded-md" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardContent>
      </article>
    );
  }
);

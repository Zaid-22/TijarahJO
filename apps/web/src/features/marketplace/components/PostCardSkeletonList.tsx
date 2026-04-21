import React from "react";
import { Skeleton } from "../../../shared/ui/skeleton";
import { postCardMediaClass } from "./postCardMediaClass";

interface PostCardSkeletonListProps {
  hideCategoryBadge?: boolean;
}

export const PostCardSkeletonList = React.memo(
  function PostCardSkeletonList({ hideCategoryBadge }: PostCardSkeletonListProps) {
    return (
      <article className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-lg dark:border-slate-800/80 dark:bg-slate-900 sm:flex-row">
        <div className="px-3 pt-3 sm:w-53 sm:shrink-0 sm:pb-3 xl:w-58">
          <div
            className={
              postCardMediaClass +
              " pointer-events-none rounded-[16px] border border-border/40 bg-muted/30 aspect-16/10 overflow-hidden shadow-md sm:h-full sm:min-h-50"
            }
          >
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            <div className="absolute inset-0 bg-linear-to-b from-black/3 via-transparent to-black/10" />

            <div className="absolute left-3 top-3 z-10">
              {!hideCategoryBadge && (
                <Skeleton className="h-6 w-20 rounded-full bg-white/80 shadow-sm backdrop-blur-md dark:bg-slate-950/45" />
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative z-20 flex min-w-0 flex-1 flex-col justify-between px-4 pb-4 pt-4 sm:px-5 sm:pb-4 sm:pt-4.5">
          <div>
            <div className="mb-2.5">
              <Skeleton className="mb-2 h-7 w-28 rounded-md" />

              <div className="space-y-1.5">
                <Skeleton className="h-5 w-4/5 rounded-md sm:h-6" />
                <Skeleton className="h-5 w-3/5 rounded-md sm:h-6" />

                <div className="flex max-w-full items-center gap-2">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>

          <div className="relative z-30 mt-4 flex flex-wrap items-stretch gap-2.5">
            <Skeleton className="h-11 min-w-0 flex-[0.92] basis-[calc(46%-0.5rem)] rounded-[16px] sm:w-38 sm:flex-none" />
            <Skeleton className="h-11 min-w-0 flex-[1.08] basis-[calc(54%-0.5rem)] rounded-[16px] sm:w-42 sm:flex-none" />
            <Skeleton className="h-11 w-11 shrink-0 rounded-[16px]" />
            <Skeleton className="h-11 w-11 shrink-0 rounded-[16px]" />
          </div>
        </div>
      </article>
    );
  }
);

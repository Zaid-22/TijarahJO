import { PostCardSkeletonGrid } from "./PostCardSkeletonGrid";
import { PostCardSkeletonList } from "./PostCardSkeletonList";
import type { ViewMode } from "../../../types";

interface PostCardSkeletonProps {
  viewMode?: ViewMode;
  hideCategoryBadge?: boolean;
}

export function PostCardSkeleton({
  viewMode = "grid-4",
  hideCategoryBadge = false,
}: PostCardSkeletonProps) {
  return viewMode === "list" ? (
    <PostCardSkeletonList hideCategoryBadge={hideCategoryBadge} />
  ) : (
    <PostCardSkeletonGrid hideCategoryBadge={hideCategoryBadge} />
  );
}

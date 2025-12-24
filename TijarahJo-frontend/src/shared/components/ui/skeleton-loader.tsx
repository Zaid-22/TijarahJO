import { Skeleton } from "./skeleton";

interface ProductCardSkeletonProps {
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
}

export function ProductCardSkeleton({ viewMode = "grid-4" }: ProductCardSkeletonProps) {
  const isListView = viewMode === "list";

  if (isListView) {
    return (
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden flex flex-col sm:flex-row backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <Skeleton className="w-full sm:w-64 aspect-square" />
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <Skeleton className="aspect-square w-full" />
      <div className="p-5">
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ 
  count = 8, 
  viewMode = "grid-4" 
}: { 
  count?: number; 
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
}) {
  const gridClass = 
    viewMode === "grid-4" 
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
      : viewMode === "grid-3"
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
      : viewMode === "grid-2"
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2"
      : "grid-cols-1";

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ height: "180px" }}>
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}

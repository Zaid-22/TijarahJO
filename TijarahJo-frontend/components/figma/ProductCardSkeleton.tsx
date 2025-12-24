import { Skeleton } from "../ui/skeleton";

interface ProductCardSkeletonProps {
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
}

export function ProductCardSkeleton({ viewMode = "grid-4" }: ProductCardSkeletonProps) {
  const isListView = viewMode === "list";

  if (isListView) {
    // List View Skeleton
    return (
      <div className="bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col sm:flex-row backdrop-blur-sm">
        {/* Image Skeleton */}
        <Skeleton className="w-full sm:w-64 aspect-square flex-shrink-0" />
        
        {/* Content Skeleton */}
        <div className="flex-1 p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-8 w-24" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Grid View Skeleton
  return (
    <div className="bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700 rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-square" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-24" />
        
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Export a component to render multiple skeletons
export function ProductGridSkeleton({ 
  count = 8, 
  viewMode = "grid-4" 
}: { 
  count?: number; 
  viewMode?: "grid-4" | "grid-3" | "grid-2" | "list";
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </>
  );
}

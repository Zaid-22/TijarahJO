import React from "react";
import { Scale } from "lucide-react";
import { useCompare, type ComparePost } from "../../../contexts/CompareContext";
import { cn } from "../../../shared/ui/utils";

interface CompareButtonProps {
  post: ComparePost;
  className?: string;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
}

export const CompareButton = React.memo(function CompareButton({
  post,
  className = "",
  isAuthenticated = false,
  onRequireAuth,
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const isSelected = isInCompare(post.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSelected) {
      removeFromCompare(post.id);
    } else {
      if (!isAuthenticated) {
        onRequireAuth?.();
        return;
      }
      addToCompare(post);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSelected ? "Remove from comparison" : "Add to comparison"}
      title={isSelected ? "Remove from comparison" : "Add to comparison"}
      className={cn(
        "pointer-events-auto z-30 inline-flex items-center justify-center rounded-full transition-all duration-200",
        isSelected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
          : "border border-white/30 bg-black/20 text-white shadow-md backdrop-blur-md hover:border-white/50 hover:bg-black/30 dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-black/50",
        className || "h-9 w-9"
      )}
    >
      <Scale className={cn("transition-all duration-200", className?.includes("h-7") ? "h-3.5 w-3.5" : "h-4 w-4")} />
    </button>
  );
});

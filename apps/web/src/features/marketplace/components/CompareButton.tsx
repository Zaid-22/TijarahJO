import React from "react";
import { Scale } from "lucide-react";
import { useCompare, type ComparePost } from "../../../contexts/CompareContext";
import { cn } from "../../../shared/ui/utils";

interface CompareButtonProps {
  post: ComparePost;
  className?: string;
}

export const CompareButton = React.memo(function CompareButton({
  post,
  className = "",
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const isSelected = isInCompare(post.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSelected) {
      removeFromCompare(post.id);
    } else {
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
          ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
          : "border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))] text-slate-700 shadow-md backdrop-blur-2xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(15,23,42,0.16))] hover:border-white/55 hover:text-primary dark:border-white/22 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(15,23,42,0.28))] dark:text-slate-300 dark:supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.32))] dark:hover:text-primary",
        className || "h-9 w-9"
      )}
    >
      <Scale className={cn("transition-all duration-200", className?.includes("h-7") ? "h-3.5 w-3.5" : "h-4 w-4")} />
    </button>
  );
});

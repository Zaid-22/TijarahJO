import { cn } from "../../../shared/ui/utils";

interface PostCardCategoryBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function PostCardCategoryBadge({
  children,
  className,
}: PostCardCategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border border-primary/20 bg-primary px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground shadow-lg dark:border-primary/30 sm:px-3",
        className,
      )}
    >
      {children}
    </span>
  );
}

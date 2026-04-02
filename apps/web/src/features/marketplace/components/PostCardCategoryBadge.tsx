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
        "inline-flex max-w-full items-center rounded-full border border-primary/20 bg-primary px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] text-primary-foreground shadow-[0_8px_18px_rgba(37,99,235,0.22)] dark:border-primary/30 sm:px-3 sm:text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

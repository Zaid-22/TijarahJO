import { cn } from "./utils";

interface LoadingStateProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  minHeightClassName?: string;
}

const spinnerSizeClass: Record<NonNullable<LoadingStateProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

const textSizeClass: Record<NonNullable<LoadingStateProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function LoadingState({
  label = "Loading...",
  size = "md",
  className,
  minHeightClassName = "min-h-[30vh]",
}: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center", minHeightClassName, className)}>
      <div className={cn("inline-flex items-center gap-2 text-muted-foreground", textSizeClass[size])}>
        <span
          aria-hidden="true"
          className={cn(
            "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
            spinnerSizeClass[size],
          )}
        />
        <span>{label}</span>
      </div>
    </div>
  );
}

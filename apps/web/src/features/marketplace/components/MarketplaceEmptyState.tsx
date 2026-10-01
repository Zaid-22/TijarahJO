import { Loader2, Search, type LucideIcon } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isActionPending?: boolean;
  actionPendingLabel?: string;
  icon?: LucideIcon;
  className?: string;
  liveRegion?: boolean;
}

export function MarketplaceEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  isActionPending = false,
  actionPendingLabel,
  icon: Icon = Search,
  className,
  liveRegion = false,
}: MarketplaceEmptyStateProps) {
  return (
    <div
      role={liveRegion ? "status" : undefined}
      aria-live={liveRegion ? "polite" : undefined}
      className={cn(
        "col-span-full flex flex-col items-center justify-center p-8 sm:p-12 text-center",
        "w-full min-h-96",
        className,
      )}
    >
      <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="max-w-md text-base text-gray-500 dark:text-gray-400 mb-6">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          onClick={onAction}
          disabled={isActionPending}
          aria-busy={isActionPending}
          aria-label={
            isActionPending && actionPendingLabel
              ? actionPendingLabel
              : actionLabel
          }
          size="lg"
          className="rounded-xl px-8 bg-primary text-white shadow-md hover:shadow-lg transition-all"
        >
          {isActionPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : null}
          {isActionPending && actionPendingLabel
            ? actionPendingLabel
            : actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

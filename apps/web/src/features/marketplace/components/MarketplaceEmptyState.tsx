import { Search, type LucideIcon } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function MarketplaceEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Search,
  className,
}: MarketplaceEmptyStateProps) {
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center justify-center p-12 lg:p-16 text-center",
        "bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-800",
        "shadow-sm backdrop-blur-sm",
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
          size="lg"
          className="rounded-xl px-8 bg-primary text-white shadow-md hover:shadow-lg transition-all"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

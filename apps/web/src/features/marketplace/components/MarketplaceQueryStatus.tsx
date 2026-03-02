import { cn } from "../../../shared/ui/utils";

interface MarketplaceQueryStatusProps {
  isLoading: boolean;
  error?: string | null;
  loadingLabel: string;
  className?: string;
}

export function MarketplaceQueryStatus({
  isLoading,
  error,
  loadingLabel,
  className,
}: MarketplaceQueryStatusProps) {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className={cn("mb-4 text-sm", className)}>
      {isLoading ? (
        <p className="text-muted-foreground">{loadingLabel}</p>
      ) : null}
      {!isLoading && error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

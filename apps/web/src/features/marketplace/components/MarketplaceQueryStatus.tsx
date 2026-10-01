import { cn } from "../../../shared/ui/utils";
import { Button } from "../../../shared/ui/button";

interface MarketplaceQueryStatusProps {
  isLoading: boolean;
  error?: string | null;
  loadingLabel: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function MarketplaceQueryStatus({
  isLoading,
  error,
  loadingLabel,
  retryLabel = "Retry",
  onRetry,
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
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
          role="alert"
        >
          <p className="text-destructive">{error}</p>
          {onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceDiscoveryToolbarProps {
  children?: ReactNode;
  className?: string;
  leftSlotClassName?: string;
}

export function MarketplaceDiscoveryToolbar({
  children,
  className,
  leftSlotClassName,
}: MarketplaceDiscoveryToolbarProps) {
  const hasLeftContent = children !== undefined && children !== null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center gap-4",
        hasLeftContent ? "justify-between" : "justify-end",
        className,
      )}
    >
      {hasLeftContent ? (
        <div className={cn("flex items-center gap-3 flex-1 flex-wrap", leftSlotClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";
import type { Language, ViewMode } from "../../../types";
import { cn } from "../../../shared/ui/utils";
import { MarketplaceViewModeBar } from "./MarketplaceViewModeBar";

interface MarketplaceDiscoveryToolbarProps {
  language: Language;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children?: ReactNode;
  className?: string;
  leftSlotClassName?: string;
  showViewModeOnMobile?: boolean;
}

export function MarketplaceDiscoveryToolbar({
  language,
  viewMode,
  onViewModeChange,
  children,
  className,
  leftSlotClassName,
  showViewModeOnMobile = false,
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

      <MarketplaceViewModeBar
        language={language}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showOnMobile={showViewModeOnMobile}
      />
    </div>
  );
}

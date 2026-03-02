import type { Language, ViewMode } from "../../../types";
import { ViewModeToggle } from "../../../shared/ui/view-mode-toggle";
import { cn } from "../../../shared/ui/utils";

type Alignment = "start" | "end";

interface MarketplaceViewModeBarProps {
  language: Language;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  alignment?: Alignment;
  showOnMobile?: boolean;
  className?: string;
}

const ALIGNMENT_CLASS: Record<Alignment, string> = {
  start: "justify-start",
  end: "justify-end",
};

export function MarketplaceViewModeBar({
  language,
  viewMode,
  onViewModeChange,
  alignment = "end",
  showOnMobile = false,
  className,
}: MarketplaceViewModeBarProps) {
  return (
    <div
      className={cn(
        showOnMobile ? "flex items-center" : "hidden sm:flex items-center",
        ALIGNMENT_CLASS[alignment],
        className,
      )}
    >
      <ViewModeToggle
        viewMode={viewMode}
        onChange={onViewModeChange}
        language={language}
        activeTone="brand"
        size="sm"
      />
    </div>
  );
}

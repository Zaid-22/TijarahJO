import { useRef, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Language } from "../../../types";
import { Button } from "../../../shared/ui/button";
import { cn } from "../../../shared/ui/utils";
import { MarketplaceDiscoveryToolbar } from "./MarketplaceDiscoveryToolbar";
import { MarketplaceSearchField } from "./MarketplaceSearchField";

interface DiscoverySearchConfig {
  value: string;
  placeholder: string;
  clearLabel: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
}

interface DiscoveryMobileFiltersConfig {
  isOpen: boolean;
  toggleLabel: string;
  content: ReactNode;
  onToggle: () => void;
}

interface MarketplaceDiscoveryControlsProps {
  language: Language;
  search?: DiscoverySearchConfig;
  leftControls?: ReactNode;
  mobileFilters?: DiscoveryMobileFiltersConfig;
  className?: string;
  toolbarClassName?: string;
  leftSlotClassName?: string;
}

export function MarketplaceDiscoveryControls({
  language,
  search,
  leftControls,
  mobileFilters,
  className,
  toolbarClassName,
  leftSlotClassName,
}: MarketplaceDiscoveryControlsProps) {
  const isRTL = language === "ar";
  const filterRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {search ? (
        <MarketplaceSearchField
          value={search.value}
          placeholder={search.placeholder}
          clearLabel={search.clearLabel}
          onChange={search.onChange}
          onSubmit={search.onSubmit}
          isRTL={isRTL}
        />
      ) : null}

      <MarketplaceDiscoveryToolbar
        className={toolbarClassName}
        leftSlotClassName={leftSlotClassName}
      >
        {mobileFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={mobileFilters.onToggle}
            className="lg:hidden border-primary text-primary"
          >
            <SlidersHorizontal className={cn("w-4 h-4", "me-2")} />
            {mobileFilters.toggleLabel}
          </Button>
        ) : null}

        {leftControls}
      </MarketplaceDiscoveryToolbar>

      {mobileFilters ? (
        <div
          ref={filterRef}
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileFilters.isOpen
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0",
          )}
        >
          <div className="flex flex-col gap-3 border-t border-border pt-3">
            {mobileFilters.content}
          </div>
        </div>
      ) : null}

    </div>
  );
}

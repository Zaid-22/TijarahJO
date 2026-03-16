import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import type { Language, ViewMode } from "../../../types";
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
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search?: DiscoverySearchConfig;
  leftControls?: ReactNode;
  mobileFilters?: DiscoveryMobileFiltersConfig;
  activeFilters?: ReactNode;
  className?: string;
  toolbarClassName?: string;
  leftSlotClassName?: string;
  showViewModeOnMobile?: boolean;
}

export function MarketplaceDiscoveryControls({
  language,
  viewMode,
  onViewModeChange,
  search,
  leftControls,
  mobileFilters,
  activeFilters,
  className,
  toolbarClassName,
  leftSlotClassName,
  showViewModeOnMobile = false,
}: MarketplaceDiscoveryControlsProps) {
  const isRTL = language === "ar";

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
        language={language}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        className={toolbarClassName}
        leftSlotClassName={leftSlotClassName}
        showViewModeOnMobile={showViewModeOnMobile}
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
        <AnimatePresence>
          {mobileFilters.isOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-3 border-t border-border pt-3">
                {mobileFilters.content}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      {activeFilters}
    </div>
  );
}

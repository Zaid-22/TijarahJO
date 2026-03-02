import { X } from "lucide-react";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";

interface MarketplaceActiveFilterItem {
  id: string;
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

interface MarketplaceActiveFiltersProps {
  title: string;
  items: MarketplaceActiveFilterItem[];
  clearAllLabel?: string;
  onClearAll?: () => void;
}

export function MarketplaceActiveFilters({
  title,
  items,
  clearAllLabel,
  onClearAll,
}: MarketplaceActiveFiltersProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">{title}:</span>
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          size="sm"
          onClick={item.onRemove}
          aria-label={item.removeLabel}
          className="h-auto p-0 hover:bg-transparent"
        >
          <Badge
            variant="outline"
            className="cursor-pointer gap-1 border-border bg-card hover:bg-muted"
          >
            {item.label}
            <X className="w-3 h-3" />
          </Badge>
        </Button>
      ))}
      {clearAllLabel && onClearAll ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
          onClick={onClearAll}
        >
          {clearAllLabel}
        </Button>
      ) : null}
    </div>
  );
}

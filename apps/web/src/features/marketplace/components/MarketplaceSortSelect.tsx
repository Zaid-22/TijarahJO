import { ArrowUpDown, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceSortOption<Value extends string> {
  value: Value;
  label: string;
}

interface MarketplaceSortSelectProps<Value extends string> {
  value: Value;
  options: MarketplaceSortOption<Value>[];
  onValueChange: (value: Value) => void;
  triggerClassName?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  placeholder?: string;
}

export function MarketplaceSortSelect<Value extends string>({
  value,
  options,
  onValueChange,
  triggerClassName,
  icon: Icon = ArrowUpDown,
  iconClassName,
  placeholder,
}: MarketplaceSortSelectProps<Value>) {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Icon
        className={cn(
          "w-4 h-4 text-muted-foreground flex-shrink-0",
          iconClassName,
        )}
      />
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as Value)}>
        <SelectTrigger className={cn("w-full sm:w-56", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

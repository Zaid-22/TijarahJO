import { useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceSearchFieldProps {
  value: string;
  placeholder: string;
  clearLabel: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  id?: string;
  name?: string;
  autoComplete?: string;
  isRTL?: boolean;
  size?: "default" | "compact";
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  clearButtonClassName?: string;
}

const INPUT_SIZE_CLASS: Record<
  NonNullable<MarketplaceSearchFieldProps["size"]>,
  string
> = {
  default: "h-14 rounded-2xl text-base",
  compact: "h-12 rounded-full text-base",
};

export function MarketplaceSearchField({
  value,
  placeholder,
  clearLabel,
  onChange,
  onSubmit,
  id,
  name,
  autoComplete,
  isRTL = false,
  size = "default",
  className,
  inputClassName,
  iconClassName,
  clearButtonClassName,
}: MarketplaceSearchFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !onSubmit) {
      return;
    }

    event.preventDefault();
    onSubmit(value);
  };

  return (
    <div
      className={cn(
        "relative group transition-all duration-300",
        className,
      )}
    >
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300",
          isFocused
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground/70",
          isRTL ? "right-4" : "left-4",
          iconClassName,
        )}
      />

      <Input
        id={id}
        name={name || "search"}
        autoComplete={autoComplete || "off"}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "border border-border/30 bg-muted/20 shadow-sm backdrop-blur-xl hover:bg-muted/40 hover:border-border/60 hover:shadow-md text-foreground placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:shadow-lg transition-all duration-300",
          INPUT_SIZE_CLASS[size],
          "px-12",
          inputClassName,
        )}
      />

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => {
            onChange("");
            onSubmit?.("");
          }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground",
            isRTL ? "left-4" : "right-4",
            clearButtonClassName,
          )}
        >
          <X className="h-5 w-5" />
        </Button>
      ) : null}
    </div>
  );
}

import { useRef, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { cn } from "../../../shared/ui/utils";

interface MarketplaceSearchFieldProps {
  value: string;
  placeholder: string;
  ariaLabel?: string;
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
  submitLabel?: string;
}

export function MarketplaceSearchField({
  value,
  placeholder,
  ariaLabel,
  submitLabel,
  onChange,
  onSubmit,
  id,
  name,
  autoComplete,
  isRTL = false,
  size = "default",
  className,
  inputClassName,
}: MarketplaceSearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const effectiveSubmitLabel = submitLabel || (isRTL ? "بحث" : "Search");

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !onSubmit) {
      return;
    }

    event.preventDefault();
    onSubmit(value);
    inputRef.current?.blur();
  };

  const paddingClass = isRTL
    ? size === "default"
      ? "pr-4 pl-16 md:pl-32"
      : "pr-4 pl-14 md:pl-28"
    : size === "default"
      ? "pl-4 pr-16 md:pr-32"
      : "pl-4 pr-14 md:pr-28";
  const submitButtonRadiusClass = isRTL
    ? "rounded-l-[11px] rounded-r-none"
    : "rounded-r-[11px] rounded-l-none";

  return (
    <div className={cn("relative group transition-all duration-300", className)}>
      <Input
        ref={inputRef}
        id={id}
        name={name || "search"}
        autoComplete={autoComplete || "off"}
        aria-label={ariaLabel || placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "border border-slate-200/50 bg-white/60 shadow-sm backdrop-blur-2xl hover:bg-white/80 hover:border-slate-300 hover:shadow-lg text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-primary/40 focus-visible:ring-[6px] focus-visible:ring-primary/5 focus-visible:shadow-xl transition-all duration-500 ease-out",
          "dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:hover:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:bg-slate-900 dark:focus-visible:border-primary/40",
          "h-14 rounded-xl text-base",
          size === "compact" && "h-12",
          paddingClass,
          inputClassName,
        )}
      />

      <div
        className={cn(
          "absolute inset-y-px flex items-stretch",
          isRTL ? "left-px" : "right-px",
        )}
      >
        <Button
          type="button"
          size="icon"
          aria-label={effectiveSubmitLabel}
          onClick={() => onSubmit?.(value)}
          className={cn(
            "h-full w-12 bg-linear-to-b from-primary to-primary/90 px-0 font-bold text-primary-foreground shadow-none transition-all duration-300 hover:brightness-105 active:brightness-95 md:w-auto md:min-w-24 md:px-4",
            submitButtonRadiusClass,
          )}
        >
          <Search className="h-5 w-5 md:hidden" strokeWidth={2.5} />
          <span className="hidden text-sm font-bold md:inline">{effectiveSubmitLabel}</span>
        </Button>
      </div>
    </div>
  );
}

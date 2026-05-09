import { useRef, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
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
  submitLabel?: string;
}



export function MarketplaceSearchField({
  value,
  placeholder,
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
      ? "pr-4 pl-16"
      : "pr-4 pl-14"
    : size === "default"
      ? "pl-4 pr-16"
      : "pl-4 pr-14";

  return (
    <div className={cn("relative group transition-all duration-300", className)}>
      <Input
        ref={inputRef}
        id={id}
        name={name || "search"}
        autoComplete={autoComplete || "off"}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}

        className={cn(
          "border border-slate-200/50 bg-white/60 shadow-sm backdrop-blur-2xl hover:bg-white/80 hover:border-slate-300 hover:shadow-lg text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-primary/40 focus-visible:ring-[6px] focus-visible:ring-primary/5 focus-visible:shadow-xl transition-all duration-500 ease-out",
          "h-14 rounded-xl text-base",
          size === "compact" && "h-12",
          paddingClass,
          inputClassName,
        )}
      />



      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center gap-1",
          isRTL ? "left-1" : "right-1",
        )}
      >
        <Button
          type="button"
          size="icon"
          aria-label={submitLabel}
          onClick={() => onSubmit?.(value)}
          className={cn(
            "h-[calc(100%-8px)] w-12 rounded-xl bg-linear-to-b from-primary to-primary/90 font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:brightness-110 active:scale-95",
            size === "compact" && "h-10 w-10",
          )}
        >
          <Search className="h-5 w-5" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}

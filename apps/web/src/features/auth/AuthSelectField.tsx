import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface AuthSelectFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  value: string;
  options: Option[];
  error?: string;
  disabled?: boolean;
  icon: LucideIcon;
  focused: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isRTL?: boolean;
}

const FIELD_ICON_CONTAINER_BASE =
  "absolute top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 pointer-events-none";

const SELECT_BASE_CLASS =
  "w-full h-12 sm:h-14 appearance-none rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-foreground bg-background outline-none";

export function AuthSelectField({
  id,
  name,
  label,
  required = false,
  value,
  options,
  error,
  disabled = false,
  icon: Icon,
  focused,
  onChange,
  onFocus,
  onBlur,
  isRTL = false,
}: AuthSelectFieldProps) {
  const isActive = focused || value.length > 0;
  const iconContainerClassName = "";
  const iconClassName = isActive ? "text-primary" : "text-muted-foreground";
  const inputStateClassName = error
    ? "border-destructive focus-visible:border-destructive"
    : focused
      ? "border-primary ring-4 ring-primary/15"
      : "border-border";

  const iconPositionClassName = isRTL
    ? "right-3 sm:right-4"
    : "left-3 sm:left-4";
  const selectLeadingPaddingClassName = isRTL
    ? "pr-11 sm:pr-16"
    : "pl-11 sm:pl-16";
  const selectTrailingPaddingClassName = isRTL
    ? "pl-12 sm:pl-14"
    : "pr-12 sm:pr-14";
  const selectTextAlignClassName = "text-start";
  const chevronPositionClassName = isRTL
    ? "left-3 sm:left-4"
    : "right-3 sm:right-4";

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`text-sm text-foreground block w-full text-start`}
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        <div
          className={`${FIELD_ICON_CONTAINER_BASE} ${iconPositionClassName} ${iconContainerClassName}`}
        >
          <Icon
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${iconClassName}`}
          />
        </div>

        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`${SELECT_BASE_CLASS} ${selectLeadingPaddingClassName} ${selectTrailingPaddingClassName} ${selectTextAlignClassName} ${inputStateClassName}`}
          disabled={disabled}
        >
          <option value="" disabled className="text-muted-foreground">
            {isRTL ? "اختر..." : "Select..."}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div
          className={`absolute top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground ${chevronPositionClassName}`}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </div>

      {error && (
        <p
          className={`mt-1 text-xs text-destructive text-start`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

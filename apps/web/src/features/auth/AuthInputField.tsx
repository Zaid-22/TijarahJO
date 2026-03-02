import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../shared/ui/input";

interface AuthInputFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  error?: string;
  disabled?: boolean;
  type: "text" | "password";
  autoComplete?: string;
  icon: LucideIcon;
  focused: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  showToggle?: boolean;
  showValue?: boolean;
  onToggleValue?: () => void;
  preventClipboardActions?: boolean;
  showValueLabel?: string;
  hideValueLabel?: string;
  isRTL?: boolean;
}

const FIELD_ICON_CONTAINER_BASE =
  "absolute top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300";

const INPUT_BASE_CLASS =
  "h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-foreground bg-background placeholder:text-muted-foreground";

export function AuthInputField({
  id,
  name,
  label,
  required = false,
  placeholder,
  value,
  error,
  disabled = false,
  type,
  autoComplete,
  icon: Icon,
  focused,
  onChange,
  onFocus,
  onBlur,
  showToggle = false,
  showValue = false,
  onToggleValue,
  preventClipboardActions = false,
  showValueLabel = "Show password",
  hideValueLabel = "Hide password",
  isRTL = false,
}: AuthInputFieldProps) {
  const isActive = focused || value.length > 0;
  const iconContainerClassName = isActive
    ? "bg-primary/10"
    : "bg-muted/70";
  const iconClassName = isActive ? "text-primary" : "text-muted-foreground";
  const inputStateClassName = error
    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
    : focused
      ? "border-primary ring-4 ring-primary/15 focus-visible:border-primary"
      : "border-border";
  const iconPositionClassName = isRTL ? "right-3 sm:right-4" : "left-3 sm:left-4";
  const inputLeadingPaddingClassName = isRTL ? "pr-11 sm:pr-16" : "pl-11 sm:pl-16";
  const inputTrailingPaddingClassName = showToggle
    ? isRTL
      ? "pl-12 sm:pl-14"
      : "pr-12 sm:pr-14"
    : "";
  const inputTextAlignClassName = isRTL ? "text-right" : "text-left";
  const togglePositionClassName = isRTL ? "left-3 sm:left-4" : "right-3 sm:right-4";

  const inputType = showToggle ? (showValue ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`text-sm text-foreground ${isRTL ? "text-right" : "text-left"}`}
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        <div className={`${FIELD_ICON_CONTAINER_BASE} ${iconPositionClassName} ${iconContainerClassName}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${iconClassName}`} />
        </div>

        <Input
          id={id}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onCopy={preventClipboardActions ? (event) => event.stopPropagation() : undefined}
          onCut={preventClipboardActions ? (event) => event.stopPropagation() : undefined}
          onPaste={preventClipboardActions ? (event) => event.stopPropagation() : undefined}
          className={`${INPUT_BASE_CLASS} ${inputLeadingPaddingClassName} ${inputTrailingPaddingClassName} ${inputTextAlignClassName} ${inputStateClassName}`}
          disabled={disabled}
        />

        {showToggle && onToggleValue && (
          <button
            type="button"
            onClick={onToggleValue}
            className={`absolute ${togglePositionClassName} top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1`}
            aria-label={showValue ? hideValueLabel : showValueLabel}
          >
            {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

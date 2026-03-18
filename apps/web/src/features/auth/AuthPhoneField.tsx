import type { LucideIcon } from "lucide-react";
import { Input } from "../../shared/ui/input";
import { APP_CONFIG } from "../../constants/appConfig";

interface AuthPhoneFieldProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
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

const INPUT_BASE_CLASS =
  "h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-foreground bg-background placeholder:text-muted-foreground font-sans";

export function AuthPhoneField({
  id,
  name,
  label,
  required = false,
  placeholder,
  value,
  error,
  disabled = false,
  icon: Icon,
  focused,
  onChange,
  onFocus,
  onBlur,
  isRTL = false,
}: AuthPhoneFieldProps) {
  const isActive = focused || value.length > 0;
  const iconContainerClassName = "";
  const iconClassName = isActive ? "text-primary" : "text-muted-foreground";
  const inputStateClassName = error
    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
    : focused
      ? "border-primary ring-4 ring-primary/15 focus-visible:border-primary"
      : "border-border";

  const iconPositionClassName = isRTL
    ? "right-3 sm:right-4"
    : "left-3 sm:left-4";

  const prefix = APP_CONFIG.defaultPhonePrefix;

  const inputPaddingClassName = isRTL
    ? "pl-4 pr-22 sm:pr-26 text-right"
    : "pr-4 pl-22 sm:pl-26 text-left";

  const prefixPositionClassName = isRTL
    ? "right-12 sm:right-14 pr-2 border-r border-transparent"
    : "left-12 sm:left-14 pl-2 border-l border-transparent";

  // Make sure placeholder does not contain the prefix or a leading zero
  const cleanPlaceholder = placeholder
    .replace(prefix, "")
    .replace(/^0/, "")
    .trim();

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={`text-sm text-foreground block w-full text-start`}
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative flex items-center w-full">
        {/* Icon */}
        <div
          className={`${FIELD_ICON_CONTAINER_BASE} ${iconPositionClassName} ${iconContainerClassName} z-10`}
        >
          <Icon
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${iconClassName}`}
          />
        </div>

        {/* Prefix Label */}
        <div
          className={`absolute select-none z-10 text-muted-foreground font-medium text-sm sm:text-base flex items-center justify-center ${prefixPositionClassName}`}
          dir="ltr"
        >
          <span
            className="inline-block py-1 border-e border-border pe-3 me-1"
          >
            {prefix}
          </span>
        </div>

        {/* Real Input */}
        <Input
          id={id}
          name={name}
          type="tel"
          dir="ltr"
          placeholder={cleanPlaceholder}
          value={value}
          onChange={(e) => {
            // Only allow digits to be typed
            const digits = e.target.value.replace(/\D/g, "");

            // Allow up to 9 digits (7XXXXXXXX)
            if (digits.length <= 9) {
              onChange(digits);
            }
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`${INPUT_BASE_CLASS} ${inputPaddingClassName} ${inputStateClassName} w-full`}
          disabled={disabled}
          maxLength={9} // Only 9 digits
        />
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

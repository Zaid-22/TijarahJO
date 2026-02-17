import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../components/ui/input";

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
}

const FIELD_ICON_CONTAINER_BASE =
  "absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300";

const INPUT_BASE_CLASS =
  "pl-11 sm:pl-16 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500";

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
}: AuthInputFieldProps) {
  const iconStyle: CSSProperties = {
    color: focused || value ? "#0A4ABF" : "#9CA3AF",
  };

  const inputStyle: CSSProperties = {
    borderColor: error ? "#EF4444" : focused ? "#0A4ABF" : "#E5E7EB",
    boxShadow: focused ? "0 0 0 4px rgba(10, 74, 191, 0.08)" : "none",
  };

  const inputType = showToggle ? (showValue ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm text-black dark:text-white">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div
          className={FIELD_ICON_CONTAINER_BASE}
          style={{
            backgroundColor: focused || value ? "rgba(10, 74, 191, 0.1)" : "#F5F6FA",
          }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300" style={iconStyle} />
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
          className={`${INPUT_BASE_CLASS} ${showToggle ? "pr-12 sm:pr-14" : ""}`}
          style={inputStyle}
          disabled={disabled}
        />

        {showToggle && onToggleValue && (
          <button
            type="button"
            onClick={onToggleValue}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors p-1"
            aria-label={showValue ? "Hide password" : "Show password"}
          >
            {showValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

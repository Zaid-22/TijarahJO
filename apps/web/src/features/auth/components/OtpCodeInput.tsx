import { useRef } from "react";

import { cn } from "../../../shared/ui/utils";

interface OtpCodeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  resendPrompt?: string;
  resendLabel?: string;
  resendingLabel?: string;
  isResending?: boolean;
  onResend?: () => void;
}

const DEFAULT_LENGTH = 6;

function sanitizeCode(value: string, length: number): string {
  return value.replace(/\D/g, "").slice(0, length);
}

export function OtpCodeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  length = DEFAULT_LENGTH,
  resendPrompt,
  resendLabel,
  resendingLabel,
  isResending = false,
  onResend,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedValue = sanitizeCode(value, length);
  const digits = Array.from({ length }, (_, index) => normalizedValue[index] ?? "");

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const applyDigitsFrom = (startIndex: number, nextDigits: string) => {
    const sanitizedDigits = sanitizeCode(nextDigits, length - startIndex);
    if (!sanitizedDigits) {
      return;
    }

    const nextValue = [...digits];
    sanitizedDigits.split("").forEach((digit, offset) => {
      nextValue[startIndex + offset] = digit;
    });

    onChange(nextValue.join("").slice(0, length));
    focusInput(Math.min(startIndex + sanitizedDigits.length, length - 1));
  };

  const updateDigit = (index: number, nextDigit: string) => {
    const sanitizedDigit = sanitizeCode(nextDigit, length);
    if (sanitizedDigit.length > 1) {
      applyDigitsFrom(index, sanitizedDigit);
      return;
    }

    const nextValue = [...digits];
    nextValue[index] = sanitizedDigit;
    onChange(nextValue.join("").slice(0, length));

    if (sanitizedDigit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const nextValue = [...digits];
      nextValue[index - 1] = "";
      onChange(nextValue.join("").slice(0, length));
      focusInput(index - 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    event.preventDefault();
    applyDigitsFrom(index, event.clipboardData.getData("text"));
  };

  const shouldShowResend = Boolean(resendPrompt && resendLabel);

  return (
    <div className="space-y-5">
      {shouldShowResend && (
        <p className="text-center text-sm font-medium text-muted-foreground sm:text-base">
          {resendPrompt}{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={!onResend || disabled || isResending}
            className="font-semibold text-primary transition-colors hover:text-primary/85 hover:underline disabled:pointer-events-none disabled:opacity-60"
          >
            {isResending ? resendingLabel || resendLabel : resendLabel}
          </button>
        </p>
      )}

      <label htmlFor={`${id}-0`} className="sr-only">
        {label}
      </label>

      <div
        dir="ltr"
        className="flex w-full justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={label}
      >
        {digits.map((digit, index) => (
          <input
            key={`${id}-${index}`}
            id={`${id}-${index}`}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={index === 0}
            value={digit}
            disabled={disabled}
            maxLength={1}
            aria-label={`${label} ${index + 1}`}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
            className={cn(
              "h-12 w-9 min-w-0 rounded-xl border border-border bg-input-background text-center text-2xl font-medium text-foreground outline-none transition-all duration-200 sm:h-14 sm:w-12 sm:text-3xl",
              "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15",
              "disabled:cursor-not-allowed disabled:opacity-60",
              digit && "border-border bg-background shadow-sm",
            )}
          />
        ))}
      </div>
    </div>
  );
}

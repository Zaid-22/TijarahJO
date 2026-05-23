interface LogoProps {
  variant?: "default" | "light" | "icon";
  size?: "sm" | "md" | "lg";
  // Legacy props for backward compatibility
  className?: string;
  color?: string;
  showText?: boolean;
  darkMode?: boolean;
}

export function Logo({
  variant,
  size = "md",
  className = "",
  color,
  showText = true,
  darkMode = false,
}: LogoProps) {
  // Auto-detect dark mode from document
  const isDarkMode =
    darkMode ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  // Handle legacy API
  let finalVariant = variant;
  let finalShowText = showText;

  // If color is provided (legacy API), map to variant
  if (color && !variant) {
    finalVariant = color === "white" ? "light" : "default";
  }

  // If showText is false, use icon variant
  if (!showText && !variant) {
    finalVariant = "icon";
    finalShowText = false;
  }

  // Default to 'default' variant if not specified
  if (!finalVariant) {
    finalVariant = "default";
  }

  // Auto-detect dark mode if variant is default
  if (finalVariant === "default" && isDarkMode) {
    finalVariant = "light";
  }

  const sizes: Record<
    NonNullable<LogoProps["size"]>,
    { iconClassName: string; textClassName: string; gapClassName: string }
  > = {
    sm: {
      iconClassName: "h-8 w-8",
      textClassName: "text-xl",
      gapClassName: "gap-2",
    },
    md: {
      iconClassName: "h-8 w-8 sm:h-10 sm:w-10",
      textClassName: "text-lg sm:text-2xl",
      gapClassName: "gap-2 sm:gap-3",
    },
    lg: {
      iconClassName: "h-12 w-12",
      textClassName: "text-3xl",
      gapClassName: "gap-3",
    },
  };

  const currentSize = sizes[size];
  const isLight = finalVariant === "light";
  const isIconOnly = finalVariant === "icon";

  const brandColorClass = "text-primary";
  const textColorClass = isLight || isDarkMode ? "text-white" : "text-black";
  const glyphColorClass = "text-primary";

  if (isIconOnly) {
    return (
      <div className={`${currentSize.iconClassName} ${className}`.trim()}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-full w-full ${brandColorClass}`}
        >
          <path d="M 28 26 H 72 V 46 H 60 V 72 H 40 V 46 H 28 Z" fill="white" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 50 12 L 82 30 L 82 70 L 50 88 L 18 70 L 18 30 Z M 28 26 H 72 V 46 H 60 V 72 H 40 V 46 H 28 Z"
            className="fill-current stroke-current"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex w-fit items-center ${currentSize.gapClassName} ${className}`.trim()}
    >
      <div className={`${currentSize.iconClassName} shrink-0`.trim()}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-full w-full ${brandColorClass}`}
        >
          <path d="M 28 26 H 72 V 46 H 60 V 72 H 40 V 46 H 28 Z" fill="white" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 50 12 L 82 30 L 82 70 L 50 88 L 18 70 L 18 30 Z M 28 26 H 72 V 46 H 60 V 72 H 40 V 46 H 28 Z"
            className="fill-current stroke-current"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {finalShowText && (
        <div className={`${currentSize.textClassName} leading-none`}>
          <div className={`${textColorClass} tracking-[-0.02em] font-bold`}>
            Tijarah
            <span className={glyphColorClass}>Jo</span>
          </div>
        </div>
      )}
    </div>
  );
}

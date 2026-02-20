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

  const brandColorClass = isLight ? "text-[#3E7EFF]" : "text-[#0A4ABF]";
  const textColorClass = isLight || isDarkMode ? "text-white" : "text-black";
  const glyphColorClass = isDarkMode ? "text-[#3E7EFF]" : brandColorClass;

  if (isIconOnly) {
    return (
      <div className={`${currentSize.iconClassName} ${className}`.trim()}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-full w-full ${brandColorClass}`}
        >
          <rect x="20" y="32" width="60" height="56" rx="6" className="fill-current" />
          <path
            d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32"
            className="stroke-current"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="50" cy="58" r="12" className={isDarkMode ? "fill-[#1a1a1a]" : "fill-white"} />
          <text
            x="50"
            y="64"
            fontSize="18"
            fontWeight="700"
            className={`fill-current ${glyphColorClass}`}
            textAnchor="middle"
          >
            T
          </text>
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
          <rect x="20" y="32" width="60" height="56" rx="6" className="fill-current" />
          <path
            d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32"
            className="stroke-current"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="50" cy="58" r="12" className={isDarkMode ? "fill-[#1a1a1a]" : "fill-white"} />
          <text
            x="50"
            y="64"
            fontSize="18"
            fontWeight="700"
            className={`fill-current ${glyphColorClass}`}
            textAnchor="middle"
          >
            T
          </text>
        </svg>
      </div>

      {finalShowText && (
        <div className={`${currentSize.textClassName} leading-none`}>
          <div className={`${textColorClass} tracking-[-0.02em] font-bold`}>
            Tijarah
            <span className={glyphColorClass}>
              Jo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

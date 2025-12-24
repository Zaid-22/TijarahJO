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

  const sizes = {
    sm: { width: 140, iconSize: 32, fontSize: "1.25rem" },
    md: {
      width: 200,
      iconSize: 40,
      iconSizeMobile: 32,
      fontSize: "1.5rem",
      fontSizeMobile: "1.25rem",
    },
    lg: { width: 260, iconSize: 48, fontSize: "2rem" },
  };

  const currentSize = sizes[size];
  const isLight = finalVariant === "light";
  const isIconOnly = finalVariant === "icon";

  // Use TijarahJo brand color #0A4ABF instead of generic blue
  // In dark mode, use light blue #3E7EFF for better visibility
  const blueColor = isLight ? "#3E7EFF" : "#0A4ABF";
  const textColor = isLight ? "#ffffff" : isDarkMode ? "#ffffff" : "#000000";

  if (isIconOnly) {
    return (
      <div
        className={className}
        style={{
          width: currentSize.iconSize,
          height: currentSize.iconSize,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <rect x="20" y="32" width="60" height="56" rx="6" fill={blueColor} />
          <path
            d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32"
            stroke={blueColor}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="50"
            cy="58"
            r="12"
            fill={isDarkMode ? "#1a1a1a" : "white"}
          />
          <text
            x="50"
            y="64"
            fontSize="18"
            fontWeight="700"
            fill={isDarkMode ? "#3E7EFF" : blueColor}
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
      className={`flex items-center gap-2 sm:gap-3 ${className}`}
      style={{ width: "fit-content" }}
    >
      <div
        className="w-8 h-8 sm:w-10 sm:h-10"
        style={{
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "100%" }}
        >
          <rect x="20" y="32" width="60" height="56" rx="6" fill={blueColor} />
          <path
            d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32"
            stroke={blueColor}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="50"
            cy="58"
            r="12"
            fill={isDarkMode ? "#1a1a1a" : "white"}
          />
          <text
            x="50"
            y="64"
            fontSize="18"
            fontWeight="700"
            fill={isDarkMode ? "#3E7EFF" : blueColor}
            textAnchor="middle"
          >
            T
          </text>
        </svg>
      </div>

      {finalShowText && (
        <div
          className="text-lg sm:text-2xl"
          style={{
            lineHeight: 1,
          }}
        >
          <div
            style={{
              color: textColor,
              letterSpacing: "-0.02em",
              fontWeight: 700,
            }}
          >
            Tijarah
            <span style={{ color: isDarkMode ? "#3E7EFF" : blueColor }}>
              Jo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

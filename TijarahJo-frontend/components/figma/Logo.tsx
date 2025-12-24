import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  darkMode?: boolean;
  className?: string;
}

export function Logo({ size = "md", variant = "default", darkMode = false, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  const textColor = variant === "light" || darkMode ? "text-white" : "text-[#0A4ABF]";
  const accentColor = variant === "light" ? "#FFFFFF" : "#0A4ABF";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shopping bag shape */}
        <path
          d="M8 10C8 9.44772 8.44772 9 9 9H23C23.5523 9 24 9.44772 24 10V26C24 27.1046 23.1046 28 22 28H10C8.89543 28 8 27.1046 8 26V10Z"
          fill={accentColor}
          opacity="0.2"
        />
        <path
          d="M8 10C8 9.44772 8.44772 9 9 9H23C23.5523 9 24 9.44772 24 10V26C24 27.1046 23.1046 28 22 28H10C8.89543 28 8 27.1046 8 26V10Z"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Handle */}
        <path
          d="M12 9V7C12 5.34315 13.3431 4 15 4H17C18.6569 4 20 5.34315 20 7V9"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Checkmark */}
        <path
          d="M13 18L15 20L19 16"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Logo Text */}
      <span className={`font-bold ${sizeClasses[size]} ${textColor} tracking-tight`} style={{ fontSize: size === "sm" ? "1rem" : size === "md" ? "1.25rem" : "1.5rem" }}>
        TijarahJo
      </span>
    </div>
  );
}

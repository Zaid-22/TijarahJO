import React, { useState, useEffect, forwardRef } from "react";

// const ERROR_IMG_SRC =
("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==");

interface ImageWithFallbackProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onError"
> {
  fallbackSrc?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const ImageWithFallback = forwardRef<
  HTMLImageElement,
  ImageWithFallbackProps
>((props, ref) => {
  const [didError, setDidError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(props.src);

  const { src, alt, style, className, fallbackSrc, ...rest } = props;

  useEffect(() => {
    setCurrentSrc(src);
    setDidError(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setDidError(true);
  };

  // Determine objectFit based on className or default to 'cover'
  const getObjectFit = () => {
    if (style?.objectFit) return style.objectFit; // Respect explicit style
    if (className?.includes("object-contain")) return "contain";
    if (className?.includes("object-cover")) return "cover";
    if (className?.includes("object-fill")) return "fill";
    if (className?.includes("object-none")) return "none";
    if (className?.includes("object-scale-down")) return "scale-down";
    return "cover"; // Default
  };

  // If src is empty or invalid, show placeholder immediately
  if (!currentSrc || currentSrc.trim() === "") {
    return (
      <div
        className={`inline-block bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-center align-middle ${className ?? ""}`}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <svg
            className="w-12 h-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">No Image</span>
        </div>
      </div>
    );
  }

  return didError ? (
    <div
      className={`inline-block bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-center align-middle ${className ?? ""}`}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
        <svg
          className="w-12 h-12 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs">Image Error</span>
      </div>
    </div>
  ) : (
    <img
      ref={ref}
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        objectFit: getObjectFit(),
      }}
      {...rest}
      onError={handleError}
    />
  );
});

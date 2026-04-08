import React, { useState, useEffect, forwardRef } from "react";

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
  const [currentSrcSet, setCurrentSrcSet] = useState(props.srcSet);

  const {
    src,
    srcSet,
    alt,
    style: _style,
    className,
    fallbackSrc,
    onError,
    ...rest
  } = props;

  useEffect(() => {
    setCurrentSrc(src);
    setCurrentSrcSet(srcSet);
    setDidError(false);
  }, [src, srcSet]);

  const handleError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setCurrentSrcSet(undefined);
      onError?.(event);
      return;
    }
    setDidError(true);
    onError?.(event);
  };

  const hasObjectFitClass =
    typeof className === "string" &&
    /\bobject-(contain|cover|fill|none|scale-down)\b/.test(className);
  const resolvedImageClassName = hasObjectFitClass
    ? `block ${className}`.trim()
    : `${className || ""} block object-cover`.trim();
  const placeholderClassName = `inline-flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.06),rgba(15,23,42,0.12))] text-center align-middle ${className ?? ""}`;
  const placeholderIconClassName = "h-12 w-12 text-white/80 drop-shadow-lg";

  // If src is empty or invalid, show placeholder immediately
  if (!currentSrc || currentSrc.trim() === "") {
    return (
      <div className={placeholderClassName}>
        <div className="flex items-center justify-center">
          <svg
            className={placeholderIconClassName}
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
        </div>
      </div>
    );
  }

  return didError ? (
    <div className={placeholderClassName}>
      <div className="flex items-center justify-center">
        <svg
          className={placeholderIconClassName}
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
      </div>
    </div>
  ) : (
    <img
      ref={ref}
      src={currentSrc}
      srcSet={currentSrcSet}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={resolvedImageClassName}
      {...rest}
      onError={handleError}
    />
  );
});

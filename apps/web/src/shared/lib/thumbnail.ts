/**
 * Converts list/card images to lower-cost variants.
 *
 * Local uploads use backend-generated ".thumb" derivatives.
 * Unsplash images are rewritten to bounded card-sized assets so the browser
 * does not download 1000px+ originals for small thumbnails.
 */
export interface ThumbnailOptions {
  width?: number;
  aspectRatio?: number;
  quality?: number;
}

interface ResponsiveThumbnailOptions extends ThumbnailOptions {
  sizes?: string;
  widths?: number[];
}

interface ResponsiveImageProps {
  sizes?: string;
  src?: string;
  srcSet?: string;
}

const DEFAULT_WIDTH = 640;
const DEFAULT_ASPECT_RATIO = 4 / 3;
const DEFAULT_QUALITY = 62;

export function toThumbnailUrl(
  imageUrl: string | undefined | null,
  options: ThumbnailOptions = {},
): string | undefined {
  if (!imageUrl) return undefined;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const optimizedExternalUrl = toOptimizedExternalImageUrl(imageUrl, options);
    if (optimizedExternalUrl) {
      return optimizedExternalUrl;
    }

    return imageUrl;
  }

  // Already a thumbnail
  if (imageUrl.includes(".thumb.")) {
    return imageUrl;
  }

  const lastDotIndex = imageUrl.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return imageUrl;
  }

  const nameWithoutExt = imageUrl.slice(0, lastDotIndex);
  const ext = imageUrl.slice(lastDotIndex);
  return `${nameWithoutExt}.thumb${ext}`;
}

export function getResponsiveImageProps(
  imageUrl: string | undefined | null,
  options: ResponsiveThumbnailOptions = {},
): ResponsiveImageProps {
  const src = toThumbnailUrl(imageUrl, options);
  if (!imageUrl) {
    return { src };
  }

  const responsiveWidths = resolveResponsiveWidths(imageUrl, options);
  if (responsiveWidths.length <= 1) {
    return {
      sizes: options.sizes,
      src,
    };
  }

  const srcSet = responsiveWidths
    .map((width) => {
      const candidateUrl = toOptimizedExternalImageUrl(imageUrl, {
        ...options,
        width,
      });
      return candidateUrl ? `${candidateUrl} ${width}w` : null;
    })
    .filter((candidate): candidate is string => candidate !== null)
    .join(", ");

  return {
    sizes: options.sizes,
    src,
    srcSet: srcSet || undefined,
  };
}

function toOptimizedExternalImageUrl(
  imageUrl: string,
  options: ThumbnailOptions = {},
): string | undefined {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return undefined;
  }

  if (parsedUrl.hostname !== "images.unsplash.com") {
    return undefined;
  }

  const targetWidth = sanitizeWidth(options.width);
  const aspectRatio = sanitizeAspectRatio(options.aspectRatio);
  const targetHeight = Math.max(1, Math.round(targetWidth / aspectRatio));
  const quality = sanitizeQuality(options.quality);
  const width = clampDimension(
    parsedUrl.searchParams.get("w"),
    targetWidth,
  );
  const height = clampDimension(
    parsedUrl.searchParams.get("h"),
    targetHeight,
  );

  parsedUrl.searchParams.set("w", String(width));
  parsedUrl.searchParams.set("h", String(height));
  parsedUrl.searchParams.set("fit", "crop");
  parsedUrl.searchParams.set(
    "crop",
    parsedUrl.searchParams.get("crop") || "entropy",
  );
  parsedUrl.searchParams.set("q", String(quality));
  parsedUrl.searchParams.set("auto", "format");
  parsedUrl.searchParams.delete("fm");

  return parsedUrl.toString();
}

function resolveResponsiveWidths(
  imageUrl: string,
  options: ResponsiveThumbnailOptions,
): number[] {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return [];
  }

  if (parsedUrl.hostname !== "images.unsplash.com") {
    return [];
  }

  const maxWidth = clampDimension(
    parsedUrl.searchParams.get("w"),
    sanitizeWidth(options.width),
  );
  const requestedWidths = options.widths?.length
    ? options.widths
    : [Math.round(maxWidth * 0.55), Math.round(maxWidth * 0.8), maxWidth];

  return Array.from(
    new Set(
      requestedWidths
        .map((value) => clampDimension(String(value), maxWidth))
        .filter((value) => Number.isFinite(value) && value >= 160),
    ),
  ).sort((left, right) => left - right);
}

function clampDimension(
  value: string | null,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, fallback);
}

function sanitizeWidth(width: number | undefined): number {
  if (!Number.isFinite(width) || !width || width <= 0) {
    return DEFAULT_WIDTH;
  }

  return Math.round(width);
}

function sanitizeAspectRatio(aspectRatio: number | undefined): number {
  if (!Number.isFinite(aspectRatio) || !aspectRatio || aspectRatio <= 0) {
    return DEFAULT_ASPECT_RATIO;
  }

  return aspectRatio;
}

function sanitizeQuality(quality: number | undefined): number {
  if (!Number.isFinite(quality) || quality == null) {
    return DEFAULT_QUALITY;
  }

  return Math.min(100, Math.max(35, Math.round(quality)));
}

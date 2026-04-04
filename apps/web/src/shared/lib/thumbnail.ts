/**
 * Converts a stored image URL to its thumbnail variant.
 * The backend generates thumbnails with ".thumb" inserted before the extension.
 * e.g. "/uploads/post-images/abc.webp" → "/uploads/post-images/abc.thumb.webp"
 *
 * Returns the original URL if no extension is found or if it's an external URL.
 */
export function toThumbnailUrl(imageUrl: string | undefined | null): string | undefined {
  if (!imageUrl) return undefined;

  // Don't transform external URLs (http/https)
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
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

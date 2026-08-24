import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { ImageLightbox } from "../../shared/ui/image-lightbox";
import { ImageWithFallback } from "../../features/marketplace/components/ImageWithFallback";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import type { Post } from "../../types";
import { getDisplayImages } from "./postDetailsUtils";

interface PostImageGalleryProps {
  post: Post;
}

export function PostImageGallery({ post }: PostImageGalleryProps) {
  const { language } = useAppSettings();
  const isRtl = language === "ar";
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { displayImages, hasMultipleImages } = getDisplayImages(post);

  useEffect(() => {
    setSelectedImage(0);
    setLightboxOpen(false);
  }, [post.id]);

  useEffect(() => {
    if (selectedImage >= displayImages.length) {
      setSelectedImage(0);
    }
  }, [selectedImage, displayImages.length]);

  const nextImage = () => {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImage(
      (prev) => (prev - 1 + displayImages.length) % displayImages.length,
    );
  };

  const lightboxImages = displayImages.filter(
    (img) => img && img.trim() !== "",
  );

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
        <div className="relative w-full bg-muted/70 dark:bg-slate-950">
          <div className="relative aspect-4/3 w-full min-h-72 overflow-hidden sm:aspect-16/10 sm:min-h-80 lg:min-h-88">
            {hasMultipleImages &&
              displayImages.map((img, idx) => {
                const isAdjacent =
                  idx === (selectedImage + 1) % displayImages.length ||
                  idx ===
                    (selectedImage - 1 + displayImages.length) %
                      displayImages.length;

                return isAdjacent && img ? (
                  <img
                    key={`preload-${idx}`}
                    src={img}
                    alt=""
                    className="hidden"
                    loading="eager"
                    decoding="async"
                    onLoad={() => {}}
                  />
                ) : null;
              })}

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute inset-0 block h-full w-full overflow-hidden p-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-inset"
              aria-label={
                isRtl
                  ? `فتح صورة ${post.name} بحجم كامل`
                  : `Open full-size image of ${post.name}`
              }
            >
              <ImageWithFallback
                key={`img-${selectedImage}`}
                src={displayImages[selectedImage] || ""}
                alt={post.name}
                className="block h-full! w-full! max-w-none object-cover object-center"
              />
            </button>

            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute start-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-0 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/50 dark:border-white/5 dark:bg-slate-930/50 dark:hover:bg-slate-900/80 sm:start-4"
                  onClick={prevImage}
                  aria-label={isRtl ? "الصورة السابقة" : "Previous image"}
                >
                  {isRtl ? (
                    <ChevronRight className="h-6 w-6 text-white" />
                  ) : (
                    <ChevronLeft className="h-6 w-6 text-white" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute end-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-0 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/50 dark:border-white/5 dark:bg-slate-930/50 dark:hover:bg-slate-900/80 sm:end-4"
                  onClick={nextImage}
                  aria-label={isRtl ? "الصورة التالية" : "Next image"}
                >
                  {isRtl ? (
                    <ChevronLeft className="h-6 w-6 text-white" />
                  ) : (
                    <ChevronRight className="h-6 w-6 text-white" />
                  )}
                </Button>

                <div className="absolute bottom-3 left-1/2 z-10 hidden lg:flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-md shadow-sm dark:bg-white/10">
                  {displayImages.map((_, index) => (
                    <button
                      key={`gallery-dot-${displayImages[index] || "image"}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className="inline-flex h-8 min-w-8 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={
                        isRtl
                          ? `الانتقال إلى الصورة ${index + 1}`
                          : `Go to image ${index + 1}`
                      }
                      aria-current={
                        index === selectedImage ? "true" : undefined
                      }
                    >
                      <span
                        className={`block h-1 rounded-full transition-all duration-300 ${
                          index === selectedImage
                            ? "w-4 bg-white"
                            : "w-1 bg-white/40"
                        }`}
                       />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </Card>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedImage < lightboxImages.length ? selectedImage : 0}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        language={language}
      />
    </>
  );
}

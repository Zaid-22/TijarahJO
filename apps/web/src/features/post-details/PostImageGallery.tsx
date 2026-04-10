import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { ImageLightbox } from "../../shared/ui/image-lightbox";
import { ImageWithFallback } from "../../features/marketplace/components/ImageWithFallback";
import type { Post } from "../../types";
import { getDisplayImages } from "./postDetailsUtils";

interface PostImageGalleryProps {
  post: Post;
}

export function PostImageGallery({ post }: PostImageGalleryProps) {
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
      <Card className="overflow-hidden shadow-2xl">
        <div className="relative w-full bg-muted">
          <div className="relative aspect-[4/3] w-full min-h-[18rem] overflow-hidden sm:aspect-[16/10] sm:min-h-[20rem] lg:min-h-[22rem]">
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

            <ImageWithFallback
              key={`img-${selectedImage}`}
              src={displayImages[selectedImage] || ""}
              alt={post.name}
              className="absolute inset-0 h-full w-full cursor-pointer object-contain"
              onClick={() => setLightboxOpen(true)}
              fallbackSrc="https://via.placeholder.com/800x600?text=No+Image+Available"
            />

            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-0 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/50 dark:border-white/5 dark:bg-slate-930/50 dark:hover:bg-slate-900/80 sm:left-4 sm:h-11 sm:w-11"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 text-white sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-0 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/50 dark:border-white/5 dark:bg-slate-930/50 dark:hover:bg-slate-900/80 sm:right-4 sm:h-11 sm:w-11"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 text-white sm:h-6 sm:w-6" />
                </Button>

                <div className="absolute bottom-3 left-1/2 z-10 hidden lg:flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-md shadow-sm dark:bg-white/10">
                  {displayImages.map((_, index) => (
                    <button
                      key={`gallery-dot-${displayImages[index] || "image"}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className="transition-all hover:scale-110 active:scale-95"
                      aria-label={`Go to image ${index + 1}`}
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

        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto border-t border-border bg-muted/30 p-3 sm:p-4 dark:border-white/10 dark:bg-slate-950/60">
            {displayImages.map((img, index) => (
              <button
                key={`gallery-thumb-${img || "image"}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedImage(index);
                  setLightboxOpen(true);
                }}
                className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${
                  index === selectedImage
                    ? "border-primary"
                    : "border-transparent"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${post.name} - ${index + 1}`}
                  className="h-full w-full object-cover"
                  fallbackSrc="https://via.placeholder.com/200x200?text=No+Image"
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedImage < lightboxImages.length ? selectedImage : 0}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

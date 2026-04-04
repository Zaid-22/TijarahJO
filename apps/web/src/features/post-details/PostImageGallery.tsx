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
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] min-h-72 sm:min-h-[22rem] lg:min-h-[24rem] overflow-hidden">
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
              className="absolute inset-0 w-full h-full object-contain cursor-pointer"
              onClick={() => setLightboxOpen(true)}
              fallbackSrc="https://via.placeholder.com/800x600?text=No+Image+Available"
            />

            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full shadow-xl transition-all hover:scale-110 border-2 border-white/20"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full shadow-xl transition-all hover:scale-110 border-2 border-white/20"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {hasMultipleImages && (
          <div className="flex justify-center gap-2 bg-card py-3">
            {displayImages.map((_, index) => (
              <button
                key={`gallery-dot-${displayImages[index] || "image"}-${index}`}
                type="button"
                onClick={() => setSelectedImage(index)}
                className="rounded-full transition-all hover:scale-125 active:scale-110 p-2"
                aria-label={`Go to image ${index + 1}`}
              >
                <span
                  className={`block rounded-full transition-all h-3 ${
                    index === selectedImage
                      ? "w-8 bg-primary"
                      : "w-3 bg-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto border-t border-border bg-muted/40 p-4">
            {displayImages.map((img, index) => (
              <button
                key={`gallery-thumb-${img || "image"}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedImage(index);
                  setLightboxOpen(true);
                }}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                  index === selectedImage
                    ? "border-primary"
                    : "border-transparent"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${post.name} - ${index + 1}`}
                  className="w-full h-full object-cover"
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

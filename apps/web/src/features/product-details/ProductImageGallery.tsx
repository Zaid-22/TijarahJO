import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../shared/ui/dialog";
import { ImageWithFallback } from "../../features/marketplace/components/ImageWithFallback";
import type { Language, Product } from "../../types";
import { getDisplayImages } from "./productDetailsUtils";

interface ProductImageGalleryProps {
  product: Product;
  language: Language;
}

export function ProductImageGallery({ product, language }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const { displayImages, hasMultipleImages } = getDisplayImages(product);

  useEffect(() => {
    setSelectedImage(0);
    setImageDialogOpen(false);
  }, [product.id]);

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

    setSelectedImage((prev) =>
      (prev - 1 + displayImages.length) % displayImages.length,
    );
  };

  return (
    <>
      <Card className="overflow-hidden dark:bg-gray-800/80 dark:border-gray-700">
        <div className="relative w-full bg-gray-100 dark:bg-gray-900">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[300px] sm:min-h-[400px] overflow-hidden">
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
                    onLoad={() => {}}
                  />
                ) : null;
              })}

            <ImageWithFallback
              key={`img-${selectedImage}`}
              src={displayImages[selectedImage] || ""}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain cursor-pointer"
              onClick={() => setImageDialogOpen(true)}
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
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm z-10 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-full shadow-xl transition-all hover:scale-110 border-2 border-white/20"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </Button>
              </>
            )}
          </div>
        </div>

        {hasMultipleImages && (
          <div className="flex gap-2 justify-center py-3 bg-white dark:bg-gray-800/80">
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
                      ? "w-8 bg-[#0A4ABF]"
                      : "w-3 bg-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {hasMultipleImages && (
          <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto border-t dark:border-gray-700">
            {displayImages.map((img, index) => (
              <button
                key={`gallery-thumb-${img || "image"}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedImage(index);
                  setImageDialogOpen(true);
                }}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                  index === selectedImage
                    ? "border-[#0A4ABF]"
                    : "border-transparent"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-full object-cover"
                  fallbackSrc="https://via.placeholder.com/200x200?text=No+Image"
                />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogTitle>{language === "ar" ? "عرض الصورة" : "View Image"}</DialogTitle>
          <DialogDescription className="sr-only">
            {language === "ar"
              ? "عرض الصورة بالحجم الكامل"
              : "View full-size image"}
          </DialogDescription>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full max-w-4xl aspect-square bg-gray-100 dark:bg-gray-800">
              <ImageWithFallback
                src={displayImages[selectedImage] || ""}
                alt={product.name}
                className="w-full h-full object-contain"
                fallbackSrc="https://via.placeholder.com/800x800?text=No+Image+Available"
              />

              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                    aria-label={language === "ar" ? "الصورة السابقة" : "Previous image"}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                    aria-label={language === "ar" ? "الصورة التالية" : "Next image"}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayImages.map((_, index) => (
                      <button
                        key={`dialog-dot-${displayImages[index] || "image"}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === selectedImage
                            ? "bg-[#0A4ABF]"
                            : "bg-white/50"
                        }`}
                        aria-label={`Open image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

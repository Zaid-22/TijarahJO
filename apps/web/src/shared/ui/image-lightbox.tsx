import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Language } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  language?: Language;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
  language = "en",
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isRtl = language === "ar";

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoom((currentZoom) => (currentZoom === 1 ? 2 : 1));
  }, []);

  if (images.length === 0) {
    return null;
  }

  const imagePosition = `${currentIndex + 1} / ${images.length}`;
  const viewerLabel = isRtl ? "عارض الصور" : "Image viewer";
  const imageDescription = isRtl
    ? `الصورة ${currentIndex + 1} من ${images.length}`
    : `Image ${currentIndex + 1} of ${images.length}`;
  const zoomLabel =
    zoom > 1
      ? isRtl
        ? "تصغير الصورة"
        : "Zoom out"
      : isRtl
        ? "تكبير الصورة"
        : "Zoom in";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        hideCloseButton
        dir={isRtl ? "rtl" : "ltr"}
        className="inset-0 z-100 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            if (isRtl) {
              goPrev();
            } else {
              goNext();
            }
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (isRtl) {
              goNext();
            } else {
              goPrev();
            }
          }
        }}
      >
        <DialogTitle className="sr-only">{viewerLabel}</DialogTitle>
        <DialogDescription className="sr-only">
          {imageDescription}
        </DialogDescription>

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-linear-to-b from-black/70 to-transparent px-4 py-3">
          <span
            className="text-sm font-medium text-white/85"
            aria-live="polite"
          >
            {imagePosition}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleZoom}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={zoomLabel}
            >
              {zoom > 1 ? (
                <ZoomOut className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ZoomIn className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isRtl ? "إغلاق عارض الصور" : "Close image viewer"}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative flex h-full w-full items-center justify-center overflow-auto px-16 py-20">
          <button
            type="button"
            onClick={toggleZoom}
            className="inline-flex max-h-full max-w-full items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
            aria-label={zoomLabel}
          >
            <img
              src={images[currentIndex]}
              alt={imageDescription}
              className={`max-h-full max-w-full cursor-pointer select-none object-contain transition-transform duration-300 ${
                zoom > 1 ? "scale-200" : "scale-100"
              }`}
              draggable={false}
            />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute start-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isRtl ? "الصورة السابقة" : "Previous image"}
            >
              {isRtl ? (
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute end-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isRtl ? "الصورة التالية" : "Next image"}
            >
              {isRtl ? (
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 overflow-x-auto bg-linear-to-t from-black/70 to-transparent px-4 py-4">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === currentIndex
                    ? "scale-110 border-white shadow-lg"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
                aria-label={
                  isRtl
                    ? `عرض الصورة ${index + 1}`
                    : `View image ${index + 1}`
                }
                aria-current={index === currentIndex ? "true" : undefined}
              >
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

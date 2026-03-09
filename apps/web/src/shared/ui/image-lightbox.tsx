import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoom((z) => (z === 1 ? 2 : 1));
  }, []);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose, goNext, goPrev]);

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white/80 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleZoom}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}
          >
            {zoom > 1 ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative z-[1] flex items-center justify-center w-full h-full px-16 py-16 overflow-auto">
        <button
          type="button"
          onClick={toggleZoom}
          className="contents"
          aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}
        >
          <img
            src={images[currentIndex]}
            alt={`${currentIndex + 1} of ${images.length}`}
            className="max-h-full max-w-full object-contain transition-transform duration-300 select-none cursor-pointer"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        </button>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-t from-black/60 to-transparent">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setZoom(1);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                idx === currentIndex
                  ? "border-white shadow-lg scale-110"
                  : "border-white/30 opacity-60 hover:opacity-100"
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

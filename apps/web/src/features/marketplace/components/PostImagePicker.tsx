import { Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Language } from "../../../types";
import { Button } from "../../../shared/ui/button";

interface PostImagePreview {
  id: string;
  previewUrl: string;
  isValidating?: boolean;
  error?: string;
}

interface PostImagePickerProps {
  language: Language;
  selectedImages: PostImagePreview[];
  maxImages: number;
  title: string;
  uploadLabel: string;
  imagesHint: string;
  imagesRequiredLabel: string;
  hasError: boolean;
  errorMessage?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function PostImagePicker({
  language,
  selectedImages,
  maxImages,
  title,
  uploadLabel,
  imagesHint,
  imagesRequiredLabel,
  hasError,
  errorMessage,
  onUpload,
  onRemove,
}: PostImagePickerProps) {
  return (
    <div className="space-y-2">
      <p className={cn("text-base font-semibold", (hasError || errorMessage) && "text-destructive")}>{title}</p>
      <div className="space-y-3">
        {selectedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {selectedImages.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 bg-muted/20",
                  image.error ? "border-destructive" : "border-border"
                )}
              >
                <img
                  src={image.previewUrl}
                  alt={`Upload ${index + 1}`}
                  className="block w-full h-auto object-contain"
                />
                {index === 0 ? (
                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                    {language === "ar" ? "غلاف" : "Cover"}
                  </div>
                ) : null}

                {/* Validating/Loading Overlay */}
                {image.isValidating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[1px]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="mt-2 text-xs font-semibold text-muted-foreground">
                      {language === "ar" ? "جاري التحقق..." : "Verifying..."}
                    </span>
                  </div>
                ) : null}

                {/* Error Banner */}
                {image.error ? (
                  <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 p-1.5 text-center text-xs font-semibold leading-tight text-destructive-foreground">
                    {image.error}
                  </div>
                ) : null}

                {/* Remove Button */}
                <Button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={
                    language === "ar"
                      ? `إزالة الصورة ${index + 1}`
                      : `Remove image ${index + 1}`
                  }
                  title={
                    language === "ar"
                      ? `إزالة الصورة ${index + 1}`
                      : `Remove image ${index + 1}`
                  }
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-2 top-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground transition-opacity hover:bg-destructive/90",
                    image.error
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {selectedImages.length < maxImages ? (
          <label
            htmlFor="image-upload"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/60",
              (hasError || errorMessage) ? "border-destructive hover:bg-destructive/5" : "border-primary"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <div className="mb-1 text-base font-bold text-primary">
                {uploadLabel}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{imagesHint}</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">
                {selectedImages.length}/{maxImages}{" "}
                {language === "ar" ? "صور محملة" : "images uploaded"}
              </div>
            </div>
            <input
              id="image-upload"
              name="images"
              aria-label={uploadLabel}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
            />
          </label>
        ) : null}

        {errorMessage ? (
          <div className="text-sm text-destructive font-semibold mt-1">{errorMessage}</div>
        ) : hasError ? (
          <div className="text-sm text-destructive font-semibold mt-1">{imagesRequiredLabel}</div>
        ) : null}
      </div>
    </div>
  );
}

import { Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Language } from "../../../types";
import { Button } from "../../../shared/ui/button";

interface PostImagePreview {
  id: string;
  previewUrl: string;
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
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
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
  onUpload,
  onRemove,
}: PostImagePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-base font-semibold">{title}</p>
      <div className="space-y-3">
        {selectedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {selectedImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border"
              >
                <img
                  src={image.previewUrl}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {index === 0 ? (
                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                    {language === "ar" ? "غلاف" : "Cover"}
                  </div>
                ) : null}
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
                  className="absolute right-2 top-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90"
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
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary p-8 transition-colors hover:bg-muted/60"
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

        {hasError ? (
          <div className="text-sm text-destructive">{imagesRequiredLabel}</div>
        ) : null}
      </div>
    </div>
  );
}

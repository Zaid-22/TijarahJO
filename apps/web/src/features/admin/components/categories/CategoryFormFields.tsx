import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../services/api";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";
import { Label } from "../../../../shared/ui/label";
import type { CategoryFormData } from "./types";

interface CategoryFormFieldsProps {
  formData: CategoryFormData;
  idPrefix: string;
  onChange: (next: CategoryFormData) => void;
}

export function CategoryFormFields({
  formData,
  idPrefix,
  onChange,
}: CategoryFormFieldsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return; 
    }

    setIsUploading(true);
    try {
      const response = await api.categories.uploadImage(file);
      if (response.success && response.url) {
        onChange({ ...formData, image: response.url });
        toast.success("Image uploaded successfully");
      } else {
        toast.error(response.message || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}-name`} className="text-right">
          Name (EN)
        </Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}-nameAr`} className="text-right">
          Name (AR)
        </Label>
        <Input
          id={`${idPrefix}-nameAr`}
          value={formData.nameAr}
          onChange={(e) => onChange({ ...formData, nameAr: e.target.value })}
          className="col-span-3"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}-image`} className="text-right">
          Image Upload
        </Label>
        <div className="col-span-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : formData.image.trim() ? "Change Image" : "Upload Image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {formData.image.trim() ? (
        <div className="grid grid-cols-4 items-center gap-4">
          <div />
          <img
            src={formData.image}
            alt="Category preview"
            className="col-span-3 h-24 w-full rounded-md border border-border object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

import { useRef } from "react";
import { Upload } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return; // file too large
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ ...formData, image: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
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
        <Label htmlFor={`${idPrefix}-color`} className="text-right">
          Color
        </Label>
        <div className="col-span-3 flex items-center gap-2">
          <Input
            id={`${idPrefix}-color`}
            type="color"
            value={formData.color}
            onChange={(e) => onChange({ ...formData, color: e.target.value })}
            className="w-12 p-1 h-10"
          />
          <span className="text-sm text-muted-foreground">{formData.color}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${idPrefix}-icon`} className="text-right">
          Icon Name
        </Label>
        <Input
          id={`${idPrefix}-icon`}
          value={formData.icon}
          onChange={(e) => onChange({ ...formData, icon: e.target.value })}
          className="col-span-3"
          placeholder="box"
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
          >
            <Upload className="w-4 h-4 mr-2" />
            {formData.image.trim() ? "Change Image" : "Upload Image"}
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

import { useRef } from "react";
import {
  Plus,
  Pencil,
  Upload,
  Link,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../shared/ui/card";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";
import { Label } from "../../../../shared/ui/label";
import { toast } from "sonner";

export type BannerFormState = {
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  buttonText: string;
  buttonTextAr: string;
  imageUrl: string;
  bgClass: string;
  textClass: string;
  altText: string;
  altTextAr: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
};

export const DEFAULT_BANNER_FORM_STATE: BannerFormState = {
  title: "",
  titleAr: "",
  subtitle: "",
  subtitleAr: "",
  buttonText: "Learn More",
  buttonTextAr: "اعرف المزيد",
  imageUrl: "",
  bgClass: "bg-background",
  textClass: "text-foreground",
  altText: "",
  altTextAr: "",
  linkUrl: "",
  isActive: true,
  displayOrder: 0,
};

type BannerFormProps = {
  editingBannerId: number | null;
  bannerForm: BannerFormState;
  onFormChange: (updater: (prev: BannerFormState) => BannerFormState) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function BannerForm({
  editingBannerId,
  bannerForm,
  onFormChange,
  onSave,
  onCancel,
}: BannerFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onFormChange((prev) => ({
        ...prev,
        imageUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="border-primary/30 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">
          {editingBannerId === null ? "Add New Banner" : "Edit Banner"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="banner-title">Title (English)</Label>
            <Input
              id="banner-title"
              placeholder="Buy and Sell Easily"
              value={bannerForm.title}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-title-ar">Title (Arabic)</Label>
            <Input
              id="banner-title-ar"
              placeholder="اشتري وبيع بسهولة"
              value={bannerForm.titleAr}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  titleAr: e.target.value,
                }))
              }
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-subtitle">Subtitle (English)</Label>
            <Input
              id="banner-subtitle"
              placeholder="Join Jordan's largest marketplace today."
              value={bannerForm.subtitle}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  subtitle: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-subtitle-ar">Subtitle (Arabic)</Label>
            <Input
              id="banner-subtitle-ar"
              placeholder="انضم إلى أكبر سوق إلكتروني في الأردن اليوم."
              value={bannerForm.subtitleAr}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  subtitleAr: e.target.value,
                }))
              }
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-button">Button Text (English)</Label>
            <Input
              id="banner-button"
              placeholder="Start Now"
              value={bannerForm.buttonText}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  buttonText: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-button-ar">Button Text (Arabic)</Label>
            <Input
              id="banner-button-ar"
              placeholder="ابدأ الآن"
              value={bannerForm.buttonTextAr}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  buttonTextAr: e.target.value,
                }))
              }
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-upload">Image Upload</Label>
            <div className="flex gap-2">
              <Button
                id="banner-upload"
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {bannerForm.imageUrl ? "Change Image" : "Upload Image"}
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
          <div className="space-y-2">
            <Label htmlFor="banner-link">Link URL (optional)</Label>
            <div className="relative">
              <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="banner-link"
                placeholder="/posts or /category/Electronics"
                value={bannerForm.linkUrl}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    linkUrl: e.target.value,
                  }))
                }
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-alt-en">Alt Text (English)</Label>
            <Input
              id="banner-alt-en"
              placeholder="Summer Sale Banner"
              value={bannerForm.altText}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  altText: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-alt-ar">Alt Text (Arabic)</Label>
            <Input
              id="banner-alt-ar"
              placeholder="إعلان التخفيضات الصيفية"
              value={bannerForm.altTextAr}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  altTextAr: e.target.value,
                }))
              }
              dir="rtl"
            />
          </div>
        </div>

        {/* Preview */}
        {bannerForm.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
            <img
              src={bannerForm.imageUrl}
              alt="Banner preview"
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
              }}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} aria-label={editingBannerId === null ? "Add Banner" : "Save Changes"}>
            {editingBannerId === null ? (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

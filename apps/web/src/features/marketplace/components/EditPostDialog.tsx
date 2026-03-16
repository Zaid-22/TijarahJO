import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Textarea } from "../../../shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../shared/ui/dialog";
import { Language } from "../../../translations";
import { Upload, X } from "lucide-react";
import { Post } from "../../../types";
import { deferredToast } from "../../../utils/toast";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import type { UpdatePostInput } from "../../../app/routes/usePostActions";

const MAX_IMAGES = 5;

type EditableImageEntry =
  | {
      id: string;
      kind: "existing";
      previewUrl: string;
      url: string;
    }
  | {
      id: string;
      kind: "new";
      previewUrl: string;
      file: File;
    };

interface EditPostDialogProps {
  post: Post;
  onSave: (post: UpdatePostInput) => void;
  onCancel: () => void;
  language?: Language;
}

function buildInitialImageEntries(post: Post): EditableImageEntry[] {
  const normalizedImages = (post.images?.length ? post.images : [post.image])
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);

  return normalizedImages.map((url, index) => ({
    id: `existing-${index}-${url}`,
    kind: "existing" as const,
    previewUrl: url,
    url,
  }));
}

export function EditPostDialog({
  post,
  onSave,
  onCancel,
  language = "en",
}: EditPostDialogProps) {

  const objectUrlsRef = useRef<Set<string>>(new Set());

  const [name, setName] = useState(post.name);
  const [price, setPrice] = useState(post.price.toString());
  const [category, setCategory] = useState(post.category);
  const [location, setLocation] = useState(post.location);
  const [area, setArea] = useState(post.area || "");
  const [images, setImages] = useState<EditableImageEntry[]>(
    buildInitialImageEntries(post),
  );
  const [description, setDescription] = useState(post.description || "");
  const { categories: catalogCategories } = useCatalogCategories();
  const categories = useMemo(() => {
    const fromCatalog = catalogCategories
      .map((entry) => entry.name.trim())
      .filter((name) => name.length > 0);
    if (fromCatalog.includes(post.category)) {
      return fromCatalog;
    }

    return [post.category, ...fromCatalog].filter((entry, index, all) => {
      return all.indexOf(entry) === index;
    });
  }, [catalogCategories, post.category]);

  const locations = [
    "Amman",
    "Irbid",
    "Zarqa",
    "Aqaba",
    "Madaba",
    "Karak",
    "Mafraq",
    "Tafilah",
  ];

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrls.clear();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }

    setImages((prev) => {
      const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
      if (remainingSlots === 0) {
        return prev;
      }

      const nextEntries = Array.from(files)
        .slice(0, remainingSlots)
        .map((file, index) => {
          const previewUrl = URL.createObjectURL(file);
          objectUrlsRef.current.add(previewUrl);
          return {
            id: `new-${file.name}-${file.size}-${file.lastModified}-${index}`,
            kind: "new" as const,
            previewUrl,
            file,
          };
        });

      return [...prev, ...nextEntries];
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (
        target &&
        target.kind === "new" &&
        objectUrlsRef.current.delete(target.previewUrl)
      ) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || !category || !location) {
      deferredToast.error(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    const priceValue = parseFloat(price);
    if (priceValue < 0.01) {
      deferredToast.error(
        language === "ar"
          ? "السعر يجب أن يكون 0.01 دينار على الأقل"
          : "Price must be at least 0.01 JOD",
      );
      return;
    }

    const updatedPost: UpdatePostInput = {
      id: post.id,
      name,
      price: priceValue,
      category,
      status: post.status,
      location,
      area,
      description,
      images: images.map((entry) =>
        entry.kind === "existing" ? entry.url : entry.file,
      ),
    };

    onSave(updatedPost);
  };

  return (
    <DialogContent className="max-w-2xl max-h-dialog-90vh overflow-y-auto">
      <DialogHeader>
        <DialogTitle className={"text-start"}>
          {language === "ar" ? "تعديل المنشور" : "Edit Post"}
        </DialogTitle>
        <DialogDescription className={"text-start"}>
          {language === "ar"
            ? "قم بتحديث معلومات منشورك أدناه"
            : "Update your post information below"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        <div className="space-y-2">
          <Label
            htmlFor="edit-name"
            className={"text-start block"}
          >
            {language === "ar" ? "اسم المنشور" : "Post Name"} *
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              language === "ar" ? "مثال: iPhone 13 Pro" : "e.g. iPhone 13 Pro"
            }
            required
            className={"text-start"}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="edit-price"
            className={"text-start block"}
          >
            {language === "ar" ? "السعر (دينار أردني)" : "Price (JOD)"} *
          </Label>
          <Input
            id="edit-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="450"
            required
            min="0.01"
            step="0.01"
            className={"text-start"}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="edit-category"
            className={"text-start block"}
          >
            {language === "ar" ? "الفئة" : "Category"} *
          </Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger
              id="edit-category"
              className={"text-start"}
            >
              <SelectValue
                placeholder={
                  language === "ar" ? "اختر الفئة" : "Select category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="edit-location"
            className={"text-start block"}
          >
            {language === "ar" ? "المدينة" : "City"} *
          </Label>
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger
              id="edit-location"
              className={"text-start"}
            >
              <SelectValue
                placeholder={language === "ar" ? "اختر المدينة" : "Select city"}
              />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="edit-area"
            className={"text-start block"}
          >
            {language === "ar" ? "المنطقة" : "Area"}
          </Label>
          <Input
            id="edit-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={language === "ar" ? "مثال: عمان" : "e.g. Amman"}
            className={"text-start"}
          />
        </div>

        <div className="space-y-2">
          <Label className={"text-start block"}>
            {language === "ar" ? "صور المنشور" : "Post Images"}
          </Label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border"
                >
                  <img
                    src={img.previewUrl}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                      {language === "ar" ? "غلاف" : "Cover"}
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
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
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <label
              htmlFor="edit-image-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary p-6 transition-colors hover:bg-muted/60"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/15">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <div className="text-sm text-primary">
                  {language === "ar" ? "رفع صور جديدة" : "Upload More Images"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {language === "ar"
                    ? "PNG, JPG, GIF حتى 5MB"
                    : "PNG, JPG, GIF up to 5MB"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {images.length}/{MAX_IMAGES} {language === "ar" ? "صور" : "images"}
                </div>
              </div>
              <input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="edit-description"
            className={"text-start block"}
          >
            {language === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}
          </Label>
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              language === "ar"
                ? "أضف وصفاً تفصيلياً لمنشورك..."
                : "Add a detailed description of your post..."
            }
            rows={4}
            className={"text-start"}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit">
            {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

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
import { translations } from "../../../translations";
import { Language } from "../../../types";
import { UserProfile } from "../../../types";
import { toast } from "sonner";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import { SellItemImagePicker } from "./SellItemImagePicker";

const MAX_IMAGES = 5;

type SelectedImage = {
  id: string;
  previewUrl: string;
  file: File;
};

interface SellItemDialogProps {
  language: Language;
  onClose: () => void;
  onSubmit?: (post: CreatePostInput) => void | Promise<void>;
  userProfile: UserProfile;
}

export function SellItemDialogContent({
  language,
  onClose,
  onSubmit,
  userProfile,
}: SellItemDialogProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    location: userProfile.city || "",
    area: userProfile.area || "",
    description: "",
  });
  const [errors, setErrors] = useState({
    title: false,
    price: false,
    category: false,
    location: false,
    images: false,
  });
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const { categories: catalogCategories, isLoading: isLoadingCategories } =
    useCatalogCategories();
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          catalogCategories
            .map((category) => category.name.trim())
            .filter((name) => name.length > 0),
        ),
      ),
    [catalogCategories],
  );
  const { cityNames, areaNames, isLoadingCities, isLoadingAreas } =
    useLocationOptions(formData.location);
  const cityOptions = useMemo(() => {
    const normalizedOptionSet = new Set(
      cityNames
        .map((city) => city.trim().toLocaleLowerCase())
        .filter((city) => city.length > 0),
    );
    const normalizedCurrentCity = formData.location.trim();
    if (
      normalizedCurrentCity &&
      !normalizedOptionSet.has(normalizedCurrentCity.toLocaleLowerCase())
    ) {
      return [normalizedCurrentCity, ...cityNames];
    }

    return cityNames;
  }, [cityNames, formData.location]);
  const areaSuggestions = useMemo(() => {
    const normalizedOptionSet = new Set(
      areaNames
        .map((area) => area.trim().toLocaleLowerCase())
        .filter((area) => area.length > 0),
    );
    const normalizedCurrentArea = formData.area.trim();
    if (
      normalizedCurrentArea &&
      !normalizedOptionSet.has(normalizedCurrentArea.toLocaleLowerCase())
    ) {
      return [normalizedCurrentArea, ...areaNames];
    }

    return areaNames;
  }, [areaNames, formData.area]);

  const t = translations[language];

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

    setSelectedImages((prev) => {
      const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
      if (remainingSlots === 0) {
        return prev;
      }

      const nextItems = Array.from(files)
        .slice(0, remainingSlots)
        .map((file, index) => {
          const previewUrl = URL.createObjectURL(file);
          objectUrlsRef.current.add(previewUrl);
          return {
            id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
            previewUrl,
            file,
          };
        });

      return [...prev, ...nextItems];
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const target = prev[index];
      if (target && objectUrlsRef.current.delete(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    // Validate form and collect errors.
    const newErrors = {
      title: !formData.title,
      price: !formData.price || parseFloat(formData.price) < 0.01,
      category: !formData.category,
      location: !formData.location,
      images: selectedImages.length === 0,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      toast.error(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    const newPost: CreatePostInput = {
      name: formData.title,
      price: parseFloat(formData.price),
      category: formData.category,
      location: formData.location,
      area: formData.area,
      description: formData.description,
      image: selectedImages[0]?.previewUrl || "",
      images: selectedImages.map((entry) => entry.file),
    };

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(newPost);
        onClose();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : language === "ar"
              ? "تعذر نشر المنشور"
              : "Failed to publish post",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    onClose();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t.itemTitle}</Label>
        <Input
          id="title"
          placeholder={t.itemTitlePlaceholder}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        {errors.title && (
          <div className="text-sm text-destructive">
            {t.titleRequired || "Title is required"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">{t.price}</Label>
          <Input
            id="price"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={t.pricePlaceholder}
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value;
              if (parseFloat(value) >= 0 || value === "") {
                setFormData({
                  ...formData,
                  price: value,
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
          />
          {errors.price && (
            <div className="text-sm text-destructive">
              {language === "ar"
                ? "السعر مطلوب ويجب أن يكون 0.01 دينار على الأقل"
                : "Price is required and must be at least 0.01 JOD"}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{t.category}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder={t.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__no_categories__" disabled>
                  {isLoadingCategories
                    ? language === "ar"
                      ? "جارٍ تحميل الفئات..."
                      : "Loading categories..."
                    : language === "ar"
                      ? "لا توجد فئات متاحة"
                      : "No categories available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.category && (
            <div className="text-sm text-destructive">
              {t.categoryRequired || "Category is required"}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t.location}</Label>
        <Select
          value={formData.location}
          onValueChange={(value) =>
            setFormData({ ...formData, location: value, area: "" })
          }
        >
          <SelectTrigger id="location">
            <SelectValue placeholder={t.locationPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {cityOptions.length > 0 ? (
              cityOptions.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__no_cities__" disabled>
                {isLoadingCities
                  ? language === "ar"
                    ? "جارٍ تحميل المدن..."
                    : "Loading cities..."
                  : language === "ar"
                    ? "لا توجد مدن متاحة"
                    : "No cities available"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.location && (
          <div className="text-sm text-destructive">
            {t.locationRequired || "Location is required"}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">
          {language === "ar"
            ? "المنطقة / الحي (اختياري)"
            : "Area / Neighborhood (Optional)"}
        </Label>
        <Input
          id="area"
          list="sell-item-area-suggestions"
          placeholder={
            language === "ar"
              ? "مثال: الدوار السابع، الصويفية، إلخ"
              : "e.g. 7th Circle, Sweifieh, etc."
          }
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
        />
        {areaSuggestions.length > 0 ? (
          <datalist id="sell-item-area-suggestions">
            {areaSuggestions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </datalist>
        ) : null}
        {isLoadingAreas ? (
          <p className="text-xs text-muted-foreground">
            {language === "ar" ? "جارٍ تحميل المناطق..." : "Loading areas..."}
          </p>
        ) : null}
      </div>

      <SellItemImagePicker
        language={language}
        selectedImages={selectedImages}
        maxImages={MAX_IMAGES}
        title={t.itemImages || "Post Images"}
        uploadLabel={t.uploadImages || "Upload Images"}
        imagesHint={t.imagesHint || "Add up to 5 images. First image will be the cover photo."}
        imagesRequiredLabel={t.imagesRequired || "Images are required"}
        hasError={errors.images}
        onUpload={handleImageUpload}
        onRemove={removeImage}
      />

      <div className="space-y-2">
        <Label htmlFor="description">{t.description}</Label>
        <Textarea
          id="description"
          placeholder={t.descriptionPlaceholder}
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
        />
      </div>

      <Button
        className="w-full text-base font-semibold"
        onClick={() => {
          void handleSubmit();
        }}
        type="button"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? language === "ar"
            ? "جارٍ النشر..."
            : "Publishing..."
          : t.postItemButton || "Publish Post"}
      </Button>
    </div>
  );
}

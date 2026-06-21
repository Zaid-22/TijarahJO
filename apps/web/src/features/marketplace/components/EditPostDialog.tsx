import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceProgressBar } from "./MarketplaceProgressBar";
import { PostForm, type PostFormData, type PostFormErrors } from "./PostForm";
import { cn } from "../../../shared/ui/utils";
import { apiRequest } from "../../../services/api/client";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "../../../shared/ui/dialog";
import { translations } from "../../../translations";
import { Language, Post } from "../../../types";
import { UpdatePostInput } from "../../../app/routes/appRoutesUtils";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";
import { deferredToast } from "../../../utils/toast";


const MAX_IMAGES = 5;

type EditableImageEntry =
  | {
      id: string;
      kind: "existing";
      previewUrl: string;
      url: string;
      isValidating?: boolean;
      error?: string;
    }
  | {
      id: string;
      kind: "new";
      previewUrl: string;
      file: File;
      isValidating?: boolean;
      error?: string;
    };

interface EditPostDialogProps {
  post: Post;
  onSave: (post: UpdatePostInput) => void | Promise<void>;
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

  language = "en",
}: EditPostDialogProps) {
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [formData, setFormData] = useState<PostFormData>({
    title: post.name,
    price: post.price.toString(),
    category: post.category,
    location: post.location,
    area: post.area || "",
    description: post.description || "",
  });

  const [images, setImages] = useState<EditableImageEntry[]>(
    buildInitialImageEntries(post),
  );
  const [imageValidationError, setImageValidationError] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<PostFormErrors>({
    title: false,
    price: false,
    category: false,
    location: false,
    area: false,
    images: false,
    description: false,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const progress = useMemo(() => {
    const steps = [
      Boolean(formData.title.trim()),
      Boolean(formData.price && parseFloat(formData.price) >= 0.01),
      Boolean(formData.category),
      Boolean(formData.location),
      Boolean(formData.area),
      Boolean(formData.description.trim()),
      images.length > 0,
    ];
    const completedSteps = steps.filter(Boolean).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [formData, images.length]);

  const { categories: catalogCategories, isLoading: isLoadingCategories } = useCatalogCategories();
  const categories = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    
    if (post.category?.trim()) {
      const c = post.category.trim();
      map.set(c, { value: c, label: c });
    }

    catalogCategories.forEach(c => {
      const name = c.name.trim();
      if (name.length > 0) {
        map.set(name, {
          value: name,
          label: language === "ar" && c.nameAr ? c.nameAr : name
        });
      }
    });
    
    return Array.from(map.values());
  }, [catalogCategories, post.category, language]);

  const { cityNames, areaNames, isLoadingCities, isLoadingAreas, cities, areas } = useLocationOptions(formData.location, language);

  // Automatically switch English/Arabic city names in formData to match current language
  useEffect(() => {
    const rawLoc = formData.location.trim().toLowerCase();
    if (!rawLoc || cities.length === 0) return;

    const matchedCity = cities.find(
      (c) => c.cityName.toLowerCase() === rawLoc || c.cityNameAr?.toLowerCase() === rawLoc
    );

    if (matchedCity) {
      const localizedName = language === "ar" && matchedCity.cityNameAr ? matchedCity.cityNameAr : matchedCity.cityName;
      if (localizedName !== formData.location) {
        setFormData(prev => ({ ...prev, location: localizedName }));
      }
    }
  }, [formData.location, cities, language]);

  // Automatically switch English/Arabic area names in formData to match current language
  useEffect(() => {
    const rawArea = formData.area.trim().toLowerCase();
    if (!rawArea || areas.length === 0) return;

    const matchedArea = areas.find(
      (a) => a.areaName.toLowerCase() === rawArea || a.areaNameAr?.toLowerCase() === rawArea
    );

    if (matchedArea) {
      const localizedArea = language === "ar" && matchedArea.areaNameAr ? matchedArea.areaNameAr : matchedArea.areaName;
      if (localizedArea !== formData.area) {
        setFormData(prev => ({ ...prev, area: localizedArea }));
      }
    }
  }, [formData.area, areas, language]);

  const cityOptions = useMemo(() => {
    const normalizedOptionSet = new Set(cityNames.map((city: string) => city.trim().toLocaleLowerCase()).filter((c: string) => c.length > 0));
    const normalizedCurrent = formData.location.trim();
    if (normalizedCurrent && !normalizedOptionSet.has(normalizedCurrent.toLocaleLowerCase())) return [normalizedCurrent, ...cityNames];
    return cityNames;
  }, [cityNames, formData.location]);

  const areaSuggestions = useMemo(() => {
    const normalizedOptionSet = new Set(areaNames.map((a: string) => a.trim().toLocaleLowerCase()).filter((a: string) => a.length > 0));
    const normalizedCurrent = formData.area.trim();
    if (normalizedCurrent && !normalizedOptionSet.has(normalizedCurrent.toLocaleLowerCase())) return [normalizedCurrent, ...areaNames];
    return areaNames;
  }, [areaNames, formData.area]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      for (const objectUrl of objectUrls) URL.revokeObjectURL(objectUrl);
      objectUrls.clear();
    };
  }, []);

  const getLocalizedImageError = (rawError: string, lang: Language) => {
    const errorLower = rawError.toLowerCase();
    if (errorLower.includes("moderation") || errorLower.includes("inappropriate") || errorLower.includes("flagged")) {
      return lang === "ar"
        ? "تم رفض الصورة بسبب فلاتر الأمان (تم اكتشاف محتوى غير لائق)."
        : "Image rejected by moderation filters (inappropriate content detected).";
    }
    if (errorLower.includes("exceeds size") || errorLower.includes("size limit") || errorLower.includes("too large")) {
      return lang === "ar"
        ? "حجم الصورة يتجاوز الحد المسموح به."
        : "Image size exceeds the allowed limit.";
    }
    if (errorLower.includes("extension") || errorLower.includes("unsupported") || errorLower.includes("content type") || errorLower.includes("type")) {
      return lang === "ar"
        ? "صيغة الصورة غير مدعومة."
        : "Unsupported image file format.";
    }
    if (errorLower.includes("empty") || errorLower.includes("required")) {
      return lang === "ar"
        ? "ملف الصورة فارغ أو مطلوب."
        : "Image file is empty or required.";
    }
    return lang === "ar" ? "فشل التحقق من صحة الصورة." : rawError;
  };

  const validateImageAsync = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("File", file);

    try {
      const response = await apiRequest<{ safe: boolean }>("/post-images/validate", {
        method: "POST",
        body: formData,
      });

      if (response.success) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, isValidating: false, error: undefined } : img
          )
        );
      } else {
        const errorMsg = response.error?.message || "Failed to validate image";
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, isValidating: false, error: getLocalizedImageError(errorMsg, language) } : img
          )
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Validation failed";
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, isValidating: false, error: getLocalizedImageError(errorMsg, language) } : img
        )
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImageValidationError(undefined);
    setImages((prev: EditableImageEntry[]) => {
      const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
      if (remainingSlots === 0) return prev;
      const nextEntries = Array.from(files).slice(0, remainingSlots).map((file: File, index: number) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);
        const itemId = `new-${file.name}-${file.size}-${file.lastModified}-${index}-${Date.now()}`;
        
        // Trigger validation asynchronously
        void validateImageAsync(itemId, file);

        return {
          id: itemId,
          kind: "new" as const,
          previewUrl,
          file,
          isValidating: true,
        };
      });
      return [...prev, ...nextEntries];
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageValidationError(undefined);
    setImages((prev: EditableImageEntry[]) => {
      const target = prev[index];
      if (target && target.kind === "new" && objectUrlsRef.current.delete(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_: EditableImageEntry, i: number) => i !== index);
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const hasValidating = images.some(img => img.isValidating);
    if (hasValidating) {
      setImageValidationError(
        language === "ar"
          ? "يرجى الانتظار حتى ينتهي التحقق من الصور"
          : "Please wait for image verification to complete"
      );
      return;
    }

    const hasErrors = images.some(img => img.error);
    if (hasErrors) {
      setImageValidationError(
        language === "ar"
          ? "فشل التحقق من أمان صورة واحدة أو أكثر. يرجى إزالة أو استبدال الصور المرفوضة قبل الحفظ"
          : "One or more images failed safety verification. Please remove or replace the flagged images before saving"
      );
      return;
    }

    // Images are only required if the original post had no images either.
    // When editing an existing post that already has images on the server,
    // allow saving even if the dialog slider never pre-populated them.
    const originalHasImage =
      (post.images?.length ?? 0) > 0 || Boolean(post.image);
    const newErrors = {
      title: !formData.title.trim(),
      price: !formData.price || parseFloat(formData.price) < 0.01,
      category: !formData.category,
      location: !formData.location,
      area: !formData.area,
      description: !formData.description.trim(),
      images: images.length === 0 && !originalHasImage,
    };

    setErrors(newErrors);

    if (newErrors.images) {
      setImageValidationError(t.imagesRequired || (language === "ar" ? "يجب إضافة صورة واحدة على الأقل" : "At least one image is required"));
    } else {
      setImageValidationError(undefined);
    }

    if (Object.values(newErrors).some(e => e)) {
      const otherErrors = { ...newErrors, images: false };
      const hasOtherErrors = Object.values(otherErrors).some(err => err);
      if (hasOtherErrors) {
        deferredToast.error(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      }
      return;
    }

    const updatedPost: UpdatePostInput = {
      id: post.id,
      name: formData.title,
      price: parseFloat(formData.price),
      category: formData.category,
      status: post.status || "ACTIVE",
      location: formData.location,
      area: formData.area,
      description: formData.description,
      images: images.map((entry: EditableImageEntry) => (entry.kind === "existing" ? entry.url : entry.file)),
    };

    setIsSubmitting(true);
    onSave(updatedPost);
  };

  const t = translations[language];

  return (
    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl max-h-dialog-90vh overflow-y-auto">
      <DialogHeader>
        <DialogTitle className={cn("text-start", language === "ar" ? "ps-12" : "pe-12")}>
          {language === "ar" ? "تعديل المنشور" : "Edit Post"}
        </DialogTitle>
        <DialogDescription className={cn("text-start", language === "ar" ? "ps-12" : "pe-12")}>
          {language === "ar"
            ? "قم بتحديث معلومات منشورك أدناه"
            : "Update your post information below"}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6">
        <MarketplaceProgressBar progress={progress} language={language} />

        <PostForm
          language={language}
          t={t}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
          cityOptions={cityOptions}
          isLoadingCities={isLoadingCities}
          areaSuggestions={areaSuggestions}
          isLoadingAreas={isLoadingAreas}
          selectedImages={images.map(img => ({ id: img.id, previewUrl: img.previewUrl, isValidating: img.isValidating, error: img.error }))}
          maxImages={MAX_IMAGES}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel={language === "ar" ? "حفظ التغييرات" : "Save Changes"}
          imageValidationError={imageValidationError}
        />
      </div>
    </DialogContent>
  );
}

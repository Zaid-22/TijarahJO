import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceProgressBar } from "./MarketplaceProgressBar";
import { PostForm, type PostFormData, type PostFormErrors } from "./PostForm";
import { cn } from "../../../shared/ui/utils";
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
    const fromCatalog = catalogCategories
      .map((entry: { name: string }) => entry.name.trim())
      .filter((name: string) => name.length > 0);
    if (fromCatalog.includes(post.category)) return fromCatalog;
    return [post.category, ...fromCatalog].filter((entry: string, index: number, all: string[]) => all.indexOf(entry) === index);
  }, [catalogCategories, post.category]);

  const { cityNames, areaNames, isLoadingCities, isLoadingAreas } = useLocationOptions(formData.location, language);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImages((prev: EditableImageEntry[]) => {
      const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
      if (remainingSlots === 0) return prev;
      const nextEntries = Array.from(files).slice(0, remainingSlots).map((file: File, index: number) => {
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

    const newErrors = {
      title: !formData.title.trim(),
      price: !formData.price || parseFloat(formData.price) < 0.01,
      category: !formData.category,
      location: !formData.location,
      area: !formData.area,
      description: !formData.description.trim(),
      images: images.length === 0,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e)) {
      deferredToast.error(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
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
          selectedImages={images.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
          maxImages={MAX_IMAGES}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel={language === "ar" ? "حفظ التغييرات" : "Save Changes"}
        />
      </div>
    </DialogContent>
  );
}

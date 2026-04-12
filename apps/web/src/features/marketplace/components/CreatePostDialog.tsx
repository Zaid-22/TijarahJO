import { useEffect, useMemo, useRef, useState } from "react";
import { translations } from "../../../translations";
import { Language } from "../../../types";
import { UserProfile } from "../../../types";
import { toast } from "sonner";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import { MarketplaceProgressBar } from "./MarketplaceProgressBar";
import { PostForm } from "./PostForm";

const MAX_IMAGES = 5;

type SelectedImage = {
  id: string;
  previewUrl: string;
  file: File;
};

interface CreatePostDialogProps {
  language: Language;
  onClose: () => void;
  onSubmit?: (post: CreatePostInput) => void | Promise<void>;
  userProfile: UserProfile;
}

export function CreatePostDialogContent({
  language,
  onClose,
  onSubmit,
  userProfile,
}: CreatePostDialogProps) {
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
    area: false,
    images: false,
    description: false,
  });

  const progress = useMemo(() => {
    const steps = [
      Boolean(formData.title.trim()),
      Boolean(formData.price && parseFloat(formData.price) >= 0.01),
      Boolean(formData.category),
      Boolean(formData.location),
      Boolean(formData.area),
      Boolean(formData.description.trim()),
      selectedImages.length > 0,
    ];
    const completedSteps = steps.filter(Boolean).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [formData, selectedImages.length]);

  const objectUrlsRef = useRef<Set<string>>(new Set());
  const { categories: catalogCategories, isLoading: isLoadingCategories } = useCatalogCategories();
  
  const categories = useMemo(() => {
    const valid = catalogCategories.filter(c => c.name.trim().length > 0);
    const map = new Map<string, { value: string; label: string }>();
    valid.forEach(c => {
      const name = c.name.trim();
      if (!map.has(name)) {
        map.set(name, {
          value: name,
          label: language === "ar" && c.nameAr ? c.nameAr : name
        });
      }
    });
    return Array.from(map.values());
  }, [catalogCategories, language]);

  const { cityNames, areaNames, isLoadingCities, isLoadingAreas, cities, areas } = useLocationOptions(
    formData.location,
    language,
  );

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
    const normalizedOptionSet = new Set(
      cityNames.map((city) => city.trim().toLocaleLowerCase()).filter((city) => city.length > 0),
    );
    const normalizedCurrentCity = formData.location.trim();
    if (normalizedCurrentCity && !normalizedOptionSet.has(normalizedCurrentCity.toLocaleLowerCase())) {
      return [normalizedCurrentCity, ...cityNames];
    }
    return cityNames;
  }, [cityNames, formData.location]);

  const areaSuggestions = useMemo(() => {
    const normalizedOptionSet = new Set(
      areaNames.map((area) => area.trim().toLocaleLowerCase()).filter((area) => area.length > 0),
    );
    const normalizedCurrentArea = formData.area.trim();
    if (normalizedCurrentArea && !normalizedOptionSet.has(normalizedCurrentArea.toLocaleLowerCase())) {
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

  useEffect(() => {
    setFormData((prev) => {
      const nextLocation = prev.location || userProfile.city || "";
      const nextArea = prev.area || userProfile.area || "";
      if (nextLocation === prev.location && nextArea === prev.area) return prev;
      return { ...prev, location: nextLocation, area: nextArea };
    });
  }, [userProfile.area, userProfile.city]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setSelectedImages((prev) => {
      const remainingSlots = Math.max(0, MAX_IMAGES - prev.length);
      if (remainingSlots === 0) return prev;

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
    if (isSubmitting) return;

    const newErrors = {
      title: !formData.title,
      price: !formData.price || parseFloat(formData.price) < 0.01,
      category: !formData.category,
      location: !formData.location,
      area: !formData.area,
      description: !formData.description.trim(),
      images: selectedImages.length === 0,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error)) {
      toast.error(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
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
    } else {
      onClose();
    }
  };

  return (
    <div className="space-y-4 py-4">
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
        selectedImages={selectedImages}
        maxImages={MAX_IMAGES}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel={language === "ar" ? "نشر المنشور" : "Publish Post"}
      />
    </div>
  );
}

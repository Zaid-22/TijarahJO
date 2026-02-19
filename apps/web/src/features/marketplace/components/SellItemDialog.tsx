import { useEffect, useState } from "react";
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
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

interface SellItemDialogProps {
  language: Language;
  onClose: () => void;
  onSubmit?: (product: {
    name: string;
    price: number;
    category: string;
    location: string;
    area: string;
    description: string;
    image: string;
    images: string[];
  }) => void;
  userProfile: UserProfile;
  onGoToSettings?: () => void;
}

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Mobile Phones & Tablets",
  "Computers & Laptops",
  "Home Appliances",
  "Furniture",
  "Vehicles",
  "Fashion & Clothing",
  "Health & Beauty",
  "Sports & Fitness",
  "Books & Stationery",
  "Toys & Games",
  "Real Estate",
  "Pets & Animals",
  "Services",
  "Other",
];

export function SellItemDialogContent({
  language,
  onClose,
  onSubmit,
  userProfile,
  // onGoToSettings,
}: SellItemDialogProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  // Auto-fill location from user profile when form loads
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
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const t = translations[language];

  // Phone number is optional - no longer required for posting

  const jordanianCities = [
    "Amman",
    "Irbid",
    "Zarqa",
    "Aqaba",
    "Madaba",
    "Salt",
    "Jerash",
    "Karak",
    "Mafraq",
    "Tafilah",
    "Ma'an",
    "Ajloun",
  ];

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.categories.getCategories();
        if (!response.success || !response.categories?.length || cancelled) {
          return;
        }

        const categoryNames = Array.from(
          new Set(
            response.categories
              .map((category) => category.name?.trim())
              .filter((name): name is string => Boolean(name)),
          ),
        ).sort((a, b) => a.localeCompare(b));

        if (categoryNames.length > 0) {
          setCategories(categoryNames);
        }
      } catch (error) {
        console.warn(
          "[SellItemDialog] Failed to load categories from backend, using defaults.",
          error,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (selectedImages.length < 5) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImages((prev) => {
              if (prev.length < 5) {
                return [...prev, reader.result as string];
              }
              return prev;
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validate form and collect errors
    const newErrors = {
      title: !formData.title,
      price: !formData.price || parseFloat(formData.price) < 0.01,
      category: !formData.category,
      location: !formData.location,
      images: selectedImages.length === 0,
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error);

    if (hasErrors) {
      toast.error(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    // Create product object
    const newProduct = {
      name: formData.title,
      price: parseFloat(formData.price),
      category: formData.category,
      location: formData.location,
      area: formData.area,
      description: formData.description,
      image: selectedImages[0] || "", // Use first image as main image
      images: selectedImages.length > 0 ? selectedImages : [], // Save all images
    };

    // Call onSubmit if provided (this will handle API call in App.tsx)
    if (onSubmit) {
      onSubmit(newProduct);
      // Close dialog after submitting
      onClose();
    } else {
      // If no onSubmit handler, just close
      onClose();
    }
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
          <div className="text-red-500 text-sm">
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
              // Prevent negative values
              const value = e.target.value;
              if (parseFloat(value) >= 0 || value === "") {
                setFormData({
                  ...formData,
                  price: value,
                });
              }
            }}
            onKeyDown={(e) => {
              // Prevent minus key
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }}
          />
          {errors.price && (
            <div className="text-red-500 text-sm">
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
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <div className="text-red-500 text-sm">
              {t.categoryRequired || "Category is required"}
            </div>
          )}
        </div>
      </div>

      {/* Location Fields - Auto-filled from user profile, can be changed for this post only */}
      <div className="space-y-2">
        <Label htmlFor="location">{t.location}</Label>
        <Select
          value={formData.location}
          onValueChange={(value) =>
            setFormData({ ...formData, location: value })
          }
        >
          <SelectTrigger id="location">
            <SelectValue placeholder={t.locationPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {jordanianCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.location && (
          <div className="text-red-500 text-sm">
            {t.locationRequired || "Location is required"}
          </div>
        )}
      </div>

      {/* Area/Neighborhood Field - Auto-filled from user profile, can be changed for this post only */}
      <div className="space-y-2">
        <Label htmlFor="area">
          {language === "ar"
            ? "المنطقة / الحي (اختياري)"
            : "Area / Neighborhood (Optional)"}
        </Label>
        <Input
          id="area"
          placeholder={
            language === "ar"
              ? "مثال: الدوار السابع، الصويفية، إلخ"
              : "e.g. 7th Circle, Sweifieh, etc."
          }
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="font-semibold text-base">
          {t.itemImages || "Post Images"}
        </Label>
        <div className="space-y-3">
          {/* Image Preview Grid */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {selectedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
                >
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: "#0A4ABF",
                        color: "white",
                      }}
                    >
                      {language === "ar" ? "غلاف" : "Cover"}
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {selectedImages.length < 5 && (
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#0A4ABF" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0A4ABF" + "15" }}
              >
                <Upload className="w-6 h-6" style={{ color: "#0A4ABF" }} />
              </div>
              <div className="text-center">
                <div
                  className="mb-1 font-bold text-base"
                  style={{ color: "#0A4ABF" }}
                >
                  {t.uploadImages || "Upload Images"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t.imagesHint ||
                    "Add up to 5 images. First image will be the cover photo."}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                  {selectedImages.length}/5{" "}
                  {language === "ar" ? "صور محملة" : "images uploaded"}
                </div>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
          {errors.images && (
            <div className="text-red-500 text-sm">
              {t.imagesRequired || "Images are required"}
            </div>
          )}
        </div>
      </div>

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
        className="w-full font-semibold text-base"
        style={{
          backgroundColor: "#0A4ABF",
          color: "white",
        }}
        onClick={handleSubmit}
        type="button"
      >
        {t.postItemButton || "Publish Post"}
      </Button>
    </div>
  );
}

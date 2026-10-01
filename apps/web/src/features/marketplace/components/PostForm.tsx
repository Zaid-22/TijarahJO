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
import { Language } from "../../../types";
import { PostImagePicker } from "./PostImagePicker";

export interface PostFormData {
  title: string;
  price: string;
  category: string;
  location: string;
  area: string;
  description: string;
}

export interface PostFormErrors {
  title: boolean;
  price: boolean;
  category: boolean;
  location: boolean;
  area: boolean;
  images: boolean;
  description: boolean;
}

interface SelectedImage {
  id: string;
  previewUrl: string;
  isValidating?: boolean;
  error?: string;
}

interface PostFormProps {
  language: Language;
  t: Record<string, string | undefined>;
  formData: PostFormData;
  setFormData: (data: PostFormData | ((prev: PostFormData) => PostFormData)) => void;
  errors: PostFormErrors;
  setErrors: (dispatch: (prev: PostFormErrors) => PostFormErrors) => void;
  categories: { value: string; label: string }[];
  isLoadingCategories: boolean;
  cityOptions: string[];
  isLoadingCities: boolean;
  areaSuggestions: string[];
  isLoadingAreas: boolean;
  selectedImages: SelectedImage[];
  maxImages: number;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  imageValidationError?: string;
}

export function PostForm({
  language,
  t,
  formData,
  setFormData,
  errors,
  setErrors,
  categories,
  isLoadingCategories,
  cityOptions,
  isLoadingCities,
  areaSuggestions,
  isLoadingAreas,
  selectedImages,
  maxImages,
  handleImageUpload,
  removeImage,
  isSubmitting,
  onSubmit,
  submitLabel,
  imageValidationError,
}: PostFormProps) {
  const isRTL = language === "ar";

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label id="title-label" htmlFor="title" className="text-start block font-semibold">{t.itemTitle || "Post Title"} *</Label>
          <Input
            id="title"
            name="title"
            placeholder={t.itemTitlePlaceholder || (isRTL ? "أدخل عنوان منشورك هنا" : "Enter your post title here")}
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={errors.title ? "border-destructive text-start" : "text-start"}
          />
          {errors.title && (
            <div className="text-sm text-destructive">
              {t.titleRequired || "Title is required"}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label id="price-label" htmlFor="price" className="text-start block font-semibold">{t.price || "Price (JOD)"} *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder={t.pricePlaceholder || (isRTL ? "أدخل السعر هنا" : "Enter price here")}
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value;
                if (parseFloat(value) >= 0 || value === "") {
                  setFormData(prev => ({ ...prev, price: value }));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E") {
                  e.preventDefault();
                }
              }}
              className={errors.price ? "border-destructive text-start" : "text-start"}
            />
            {errors.price && (
              <div className="text-sm text-destructive">
                {isRTL
                  ? "السعر مطلوب ويجب أن يكون 0.01 دينار على الأقل"
                  : "Price is required and must be at least 0.01 JOD"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label id="category-label" htmlFor="category" className="text-start block font-semibold">{t.category || "Category"} *</Label>
            <Select
              name="category"
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="category" className={errors.category ? "border-destructive text-start" : "text-start"}>
                <SelectValue placeholder={t.categoryPlaceholder || (isRTL ? "اختر فئة لمنشورك" : "Choose a category for your post")} />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-start">
                      {category.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_categories__" disabled>
                    {isLoadingCategories
                      ? isRTL ? "جارٍ تحميل الفئات..." : "Loading categories..."
                      : isRTL ? "لا توجد فئات متاحة" : "No categories available"}
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
          <Label id="location-label" htmlFor="location" className="text-start block font-semibold">{t.location || "City"} *</Label>
          <Select
            name="location"
            value={formData.location}
            onValueChange={(value) => setFormData(prev => ({ ...prev, location: value, area: "" }))}
          >
            <SelectTrigger id="location" className={errors.location ? "border-destructive text-start" : "text-start"}>
              <SelectValue placeholder={t.locationPlaceholder || (isRTL ? "في أي مدينة يقع هذا المنشور؟" : "Which city is this post in?")} />
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
                    ? isRTL ? "جارٍ تحميل المدن..." : "Loading cities..."
                    : isRTL ? "لا توجد مدن متاحة" : "No cities available"}
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
          <Label id="area-label" htmlFor="area" className="text-start block font-semibold">
            {t.area || (isRTL ? "المنطقة / الحي" : "Area / Neighborhood")} *
          </Label>
          <Select
            name="area"
            value={formData.area}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, area: value }));
              if (errors.area) setErrors((prev) => ({ ...prev, area: false }));
            }}
            disabled={!formData.location || isLoadingAreas}
          >
            <SelectTrigger id="area" className={cn("text-start", errors.area ? "border-destructive" : "")}>
              <SelectValue placeholder={
                !formData.location
                  ? t.selectCityFirst || (isRTL ? "اختر المدينة أولاً" : "Select a city first")
                  : isLoadingAreas
                    ? isRTL ? "جارٍ تحميل المناطق..." : "Loading areas..."
                    : t.areaPlaceholder || (isRTL
                      ? "مثال: عبدون، خلدا، طبربور..."
                      : "e.g. Abdoun, Khalda, Tabarbour...")
              } />
            </SelectTrigger>
            <SelectContent>
              {areaSuggestions.length > 0 ? (
                areaSuggestions.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__no_sell_areas__" disabled>
                  {isLoadingAreas
                    ? isRTL ? "جارٍ تحميل المناطق..." : "Loading areas..."
                    : isRTL ? "لا توجد مناطق متاحة" : "No areas available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.area && (
            <div className="text-sm text-destructive">
              {isRTL ? "المنطقة مطلوبة" : "Area is required"}
            </div>
          )}
        </div>

        <PostImagePicker
          language={language}
          selectedImages={selectedImages}
          maxImages={maxImages}
          title={t.itemImages || "Post Images"}
          uploadLabel={t.uploadImages || "Upload Images"}
          imagesHint={t.imagesHint || "Add up to 5 images. First image will be the cover photo."}
          imagesRequiredLabel={t.imagesRequired || "Images are required"}
          hasError={errors.images}
          errorMessage={imageValidationError}
          onUpload={handleImageUpload}
          onRemove={removeImage}
        />

        <div className="space-y-2">
          <Label htmlFor="description" className="text-start block font-semibold">{t.description || "Description"} *</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={t.descriptionPlaceholder || (isRTL ? "أخبرنا المزيد عما تنشره" : "Tell us more about what you are posting")}
            rows={4}
            maxLength={1200}
            value={formData.description}
            onChange={(e) => {
              const value = e.target.value.slice(0, 1200);
              setFormData(prev => ({ ...prev, description: value }));
              if (errors.description) setErrors((prev) => ({ ...prev, description: false }));
            }}
            className={cn("text-start", errors.description ? "border-destructive" : "")}
          />
          <div className={cn(
            "text-end text-xs",
            formData.description.length >= 1100 ? "text-destructive font-medium" : "text-muted-foreground",
          )}>
            {formData.description.length} / 1200
          </div>
          {errors.description && (
            <div className="text-sm text-destructive">
              {isRTL ? "الوصف مطلوب" : "Description is required"}
            </div>
          )}
        </div>


        <Button
          className="w-full text-base font-bold py-6 mt-4 shadow-lg active:scale-95 transition-transform"
          onClick={() => onSubmit()}
          type="button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isRTL ? "جارٍ المعالجة..." : "Processing..."
            : submitLabel || (isRTL ? "نشر المنشور" : "Publish Post")}
        </Button>
      </div>
    </>
  );
}

// Helper to keep imports clean
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

import { useState } from "react";
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
// import { translations, Language } from "../../../translations";
import { Language } from "../../../translations";
import { categoryData } from "../../../data/categoryData";
import { Upload, X } from "lucide-react";
import { Product } from "../../../types";

interface EditProductDialogProps {
  product: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
  language?: Language;
}

export function EditProductDialog({
  product,
  onSave,
  onCancel,
  language = "en",
}: EditProductDialogProps) {
  // const t = translations[language];
  const isRTL = language === "ar";

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState(product.category);
  const [location, setLocation] = useState(product.location);
  const [area, setArea] = useState(product.area || "");
  // const [image, setImage] = useState(product.image);
  const [images, setImages] = useState<string[]>(
    product.images || [product.image],
  );
  const [description, setDescription] = useState(product.description || "");

  // Use categories from categoryData (same as home page)
  const categories = categoryData.map((cat) => cat.name);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        if (images.length + newImages.length < 5) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            newImages.push(result);
            if (
              newImages.length === Math.min(files.length, 5 - images.length)
            ) {
              const updatedImages = [...images, ...newImages];
              setImages(updatedImages);
              // setImage(updatedImages[0]); // Update main image to first
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    if (updatedImages.length > 0) {
      // setImage(updatedImages[0]); // Update main image to first
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price || !category || !location) {
      alert(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    // Validate price is at least 0.01 JOD
    const priceValue = parseFloat(price);
    if (priceValue < 0.01) {
      alert(
        language === "ar"
          ? "السعر يجب أن يكون 0.01 دينار على الأقل"
          : "Price must be at least 0.01 JOD",
      );
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name,
      price: priceValue,
      category,
      location,
      area,
      image: images[0] || product.image,
      images: images,
      description: description,
    };

    onSave(updatedProduct);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className={isRTL ? "text-right" : ""}>
          {language === "ar" ? "تعديل المنتج" : "Edit Post"}
        </DialogTitle>
        <DialogDescription className={isRTL ? "text-right" : ""}>
          {language === "ar"
            ? "قم بتحديث معلومات منتجك أدناه"
            : "Update your post information below"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Post Name */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-name"
            className={isRTL ? "text-right block" : ""}
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
            className={isRTL ? "text-right" : ""}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-price"
            className={isRTL ? "text-right block" : ""}
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
            className={isRTL ? "text-right" : ""}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-category"
            className={isRTL ? "text-right block" : ""}
          >
            {language === "ar" ? "الفئة" : "Category"} *
          </Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger
              id="edit-category"
              className={isRTL ? "text-right" : ""}
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

        {/* City */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-location"
            className={isRTL ? "text-right block" : ""}
          >
            {language === "ar" ? "المدينة" : "City"} *
          </Label>
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger
              id="edit-location"
              className={isRTL ? "text-right" : ""}
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

        {/* Area */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-area"
            className={isRTL ? "text-right block" : ""}
          >
            {language === "ar" ? "المنطقة" : "Area"}
          </Label>
          <Input
            id="edit-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={language === "ar" ? "مثال: عمان" : "e.g. Amman"}
            className={isRTL ? "text-right" : ""}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className={isRTL ? "text-right block" : ""}>
            {language === "ar" ? "صور المنشور" : "Post Images"}
          </Label>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group"
                >
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
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
                    type="button"
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
          {images.length < 5 && (
            <label
              htmlFor="edit-image-upload"
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#0A4ABF" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0A4ABF" + "15" }}
              >
                <Upload className="w-5 h-5" style={{ color: "#0A4ABF" }} />
              </div>
              <div className="text-center">
                <div className="text-sm" style={{ color: "#0A4ABF" }}>
                  {language === "ar" ? "رفع صور جديدة" : "Upload More Images"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {language === "ar"
                    ? "PNG, JPG, GIF حتى 5MB"
                    : "PNG, JPG, GIF up to 5MB"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {images.length}/5 {language === "ar" ? "صور" : "images"}
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

        {/* Description (optional) */}
        <div className="space-y-2">
          <Label
            htmlFor="edit-description"
            className={isRTL ? "text-right block" : ""}
          >
            {language === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}
          </Label>
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              language === "ar"
                ? "أضف وصفاً تفصيلياً لمنتجك..."
                : "Add a detailed description of your product..."
            }
            rows={4}
            className={isRTL ? "text-right" : ""}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#0A4ABF", color: "white" }}
          >
            {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

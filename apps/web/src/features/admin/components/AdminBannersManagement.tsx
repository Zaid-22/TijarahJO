import { useState, useCallback, useRef, useEffect } from "react";
import {
  Image,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Upload,
  Link,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Badge } from "../../../shared/ui/badge";
import { toast } from "sonner";
import { adminApi } from "../../../services/api/admin";
import { type BannerModel } from "../../../services/api/banners";
import { LoadingState } from "../../../shared/ui/loading-state";

export function AdminBannersManagement() {
  const [banners, setBanners] = useState<BannerModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New banner form state
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newAltText, setNewAltText] = useState("");
  const [newAltTextAr, setNewAltTextAr] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const loadBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getBanners();
      setBanners(data || []);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const toggleActive = async (id: number) => {
    const success = await adminApi.toggleBannerActive(id);
    if (success) {
      toast.success("Banner visibility updated");
      loadBanners();
    } else {
      toast.error("Failed to update visibility");
    }
  };

  const removeBanner = async (id: number) => {
    // Relying on backend deletion; advanced prompt could be added later
    const success = await adminApi.deleteBanner(id);
    if (success) {
      toast.success("Banner removed");
      loadBanners();
    } else {
      toast.error("Failed to remove banner");
    }
  };

  const addBanner = async () => {
    if (!newImageUrl.trim()) {
      toast.error("Image URL is required");
      return;
    }

    const newBanner = {
      title: "",
      titleAr: "",
      subtitle: "",
      subtitleAr: "",
      buttonText: "Learn More",
      buttonTextAr: "اعرف المزيد",
      bgClass: "bg-background",
      textClass: "text-foreground",
      imageUrl: newImageUrl.trim(),
      altText: newAltText.trim() || "Banner ad",
      altTextAr: newAltTextAr.trim() || "إعلان",
      linkUrl: newLinkUrl.trim() || undefined,
      isActive: true,
      displayOrder: banners.length,
    };

    const success = await adminApi.createBanner(newBanner);
    if (success) {
      setNewImageUrl("");
      setNewAltText("");
      setNewAltTextAr("");
      setNewLinkUrl("");
      setShowAddForm(false);
      toast.success("Banner added successfully");
      loadBanners();
    } else {
      toast.error("Failed to add banner");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImageUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...banners];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, dragged);
    updated.forEach((b, idx) => {
      b.displayOrder = idx;
    });
    setBanners(updated);
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    let allSuccess = true;
    for (const b of banners) {
      const success = await adminApi.updateBanner(b.bannerID, b);
      if (!success) allSuccess = false;
    }
    if (allSuccess) {
      toast.success("Banner order updated");
    } else {
      toast.error("Failed to update some banner orders");
    }
    loadBanners();
  };

  if (isLoading) {
    return <LoadingState label="Loading Banners..." minHeightClassName="min-h-[400px]" />;
  }

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hero Banners
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the homepage carousel banners. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {activeCount} active / {banners.length} total
          </Badge>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </Button>
        </div>
      </div>

      {/* Add Banner Form */}
      {showAddForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Add New Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {newImageUrl ? "Change Image" : "Upload Image"}
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
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-alt-en">Alt Text (English)</Label>
                <Input
                  id="banner-alt-en"
                  placeholder="Summer Sale Banner"
                  value={newAltText}
                  onChange={(e) => setNewAltText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-alt-ar">Alt Text (Arabic)</Label>
                <Input
                  id="banner-alt-ar"
                  placeholder="إعلان التخفيضات الصيفية"
                  value={newAltTextAr}
                  onChange={(e) => setNewAltTextAr(e.target.value)}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Preview */}
            {newImageUrl && (
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                <img
                  src={newImageUrl}
                  alt="Banner preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={addBanner}>
                <Plus className="w-4 h-4 mr-2" />
                Add Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners List */}
      <div className="space-y-3">
        {banners.map((banner, index) => (
          <Card
            key={banner.bannerID}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 ${
              dragIndex === index
                ? "opacity-50 scale-95 border-primary"
                : "hover:shadow-md"
            } ${!banner.isActive ? "opacity-60" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Preview Image */}
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.altText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {banner.altText}
                    </p>
                    <Badge
                      variant={banner.isActive ? "default" : "outline"}
                      className="text-xs flex-shrink-0"
                    >
                      {banner.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    dir="rtl"
                  >
                    {banner.altTextAr}
                  </p>
                  {banner.linkUrl && (
                    <p className="text-xs text-primary mt-1 truncate">
                      → {banner.linkUrl}
                    </p>
                  )}
                </div>

                {/* Order */}
                <div className="text-xs text-muted-foreground font-mono w-8 text-center flex-shrink-0">
                   #{banner.displayOrder} ({index + 1})
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleActive.bind(null, banner.bannerID)}
                    title={banner.isActive ? "Hide banner" : "Show banner"}
                    aria-label={banner.isActive ? "Hide banner" : "Show banner"}
                    className="h-8 w-8"
                  >
                    {banner.isActive ? (
                      <Eye className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeBanner.bind(null, banner.bannerID)}
                    title="Remove banner"
                    aria-label="Remove banner"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Image className="h-12 w-12 opacity-30" />
            <p className="font-medium text-lg">No banners configured</p>
            <p className="text-sm">
              Add banners or reset to defaults to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

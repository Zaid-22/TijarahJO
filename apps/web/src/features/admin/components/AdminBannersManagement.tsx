import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import { toast } from "sonner";
import { adminBannersApi as adminApi } from "../../../services/api/admin-banners";
import { type BannerModel } from "../../../services/api/banners";
import { LoadingState } from "../../../shared/ui/loading-state";
import { getAllHeroBanners } from "../../home/components/heroBannerData";
import {
  BannerForm,
  DEFAULT_BANNER_FORM_STATE,
  type BannerFormState,
} from "./banners/BannerForm";
import { BannerListItem } from "./banners/BannerListItem";
import { FallbackBannerPreview } from "./banners/FallbackBannerPreview";

function toBannerFormState(
  banner?: BannerModel,
  displayOrder = 0,
): BannerFormState {
  if (!banner) {
    return {
      ...DEFAULT_BANNER_FORM_STATE,
      displayOrder,
    };
  }

  return {
    title: banner.title || "",
    titleAr: banner.titleAr || "",
    subtitle: banner.subtitle || "",
    subtitleAr: banner.subtitleAr || "",
    buttonText: banner.buttonText || "Learn More",
    buttonTextAr: banner.buttonTextAr || "اعرف المزيد",
    imageUrl: banner.imageUrl || "",
    bgClass: banner.bgClass || "bg-background",
    textClass: banner.textClass || "text-foreground",
    altText: banner.altText || "",
    altTextAr: banner.altTextAr || "",
    linkUrl: banner.linkUrl || "",
    isActive: banner.isActive,
    displayOrder: banner.displayOrder,
  };
}

export function AdminBannersManagement() {
  const [banners, setBanners] = useState<BannerModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(
    DEFAULT_BANNER_FORM_STATE,
  );

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

  const resetBannerForm = useCallback(() => {
    setEditingBannerId(null);
    setBannerForm(toBannerFormState(undefined, banners.length));
  }, [banners.length]);

  const openCreateForm = () => {
    setEditingBannerId(null);
    setBannerForm(toBannerFormState(undefined, banners.length));
    setShowBannerForm(true);
  };

  const openEditForm = (banner: BannerModel) => {
    setEditingBannerId(banner.bannerID);
    setBannerForm(toBannerFormState(banner, banner.displayOrder));
    setShowBannerForm(true);
  };

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
    const success = await adminApi.deleteBanner(id);
    if (success) {
      toast.success("Banner removed");
      loadBanners();
    } else {
      toast.error("Failed to remove banner");
    }
  };

  const saveBanner = async () => {
    if (!bannerForm.imageUrl.trim()) {
      toast.error("Image URL is required");
      return;
    }

    if (!bannerForm.title.trim() && !bannerForm.titleAr.trim()) {
      toast.error("Banner title is required");
      return;
    }

    const payload = {
      title: bannerForm.title.trim() || bannerForm.titleAr.trim(),
      titleAr: bannerForm.titleAr.trim() || bannerForm.title.trim(),
      subtitle: bannerForm.subtitle.trim() || bannerForm.subtitleAr.trim(),
      subtitleAr: bannerForm.subtitleAr.trim() || bannerForm.subtitle.trim(),
      buttonText:
        bannerForm.buttonText.trim() || DEFAULT_BANNER_FORM_STATE.buttonText,
      buttonTextAr:
        bannerForm.buttonTextAr.trim() ||
        bannerForm.buttonText.trim() ||
        DEFAULT_BANNER_FORM_STATE.buttonTextAr,
      bgClass: bannerForm.bgClass.trim() || DEFAULT_BANNER_FORM_STATE.bgClass,
      textClass:
        bannerForm.textClass.trim() || DEFAULT_BANNER_FORM_STATE.textClass,
      imageUrl: bannerForm.imageUrl.trim(),
      altText:
        bannerForm.altText.trim() ||
        bannerForm.title.trim() ||
        bannerForm.titleAr.trim() ||
        "Banner ad",
      altTextAr:
        bannerForm.altTextAr.trim() ||
        bannerForm.titleAr.trim() ||
        bannerForm.title.trim() ||
        "إعلان",
      linkUrl: bannerForm.linkUrl.trim() || undefined,
      isActive: bannerForm.isActive,
      displayOrder:
        editingBannerId === null ? banners.length : bannerForm.displayOrder,
    };

    const result =
      editingBannerId === null
        ? await adminApi.createBanner(payload)
        : await adminApi.updateBanner(editingBannerId, payload);

    if (result.success) {
      setShowBannerForm(false);
      resetBannerForm();
      toast.success(
        editingBannerId === null
          ? "Banner added successfully"
          : "Banner updated successfully",
      );
      loadBanners();
    } else {
      toast.error(
        result.message ||
          (editingBannerId === null
            ? "Failed to add banner"
            : "Failed to update banner"),
      );
    }
  };

  const resetToDefaults = async () => {
    setIsLoading(true);
    const defaults = getAllHeroBanners();
    let successCount = 0;

    for (const banner of defaults) {
      const result = await adminApi.createBanner({
        title: banner.title,
        titleAr: banner.titleAr,
        subtitle: banner.subtitle,
        subtitleAr: banner.subtitleAr,
        buttonText: banner.buttonText,
        buttonTextAr: banner.buttonTextAr,
        bgClass: banner.bgClass,
        textClass: banner.textClass,
        imageUrl: banner.imageUrl,
        altText: banner.altText,
        altTextAr: banner.altTextAr,
        linkUrl: banner.linkUrl,
        isActive: banner.isActive,
        displayOrder: banner.order,
      });
      if (result.success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Restored ${successCount} default banners`);
      loadBanners();
    } else {
      toast.error("Failed to restore default banners");
      setIsLoading(false);
    }
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
      const result = await adminApi.updateBanner(b.bannerID, b);
      if (!result.success) allSuccess = false;
    }
    if (allSuccess) {
      toast.success("Banner order updated");
    } else {
      toast.error("Failed to update some banner orders");
    }
    loadBanners();
  };

  if (isLoading) {
    return <LoadingState label="Loading Banners..." minHeightClassName="min-h-96" />;
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
            {activeCount} active / {banners.length} backend
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              if (showBannerForm && editingBannerId === null) {
                setShowBannerForm(false);
                resetBannerForm();
                return;
              }
              openCreateForm();
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </Button>
        </div>
      </div>

      {/* Add / Edit Banner Form */}
      {showBannerForm && (
        <BannerForm
          editingBannerId={editingBannerId}
          bannerForm={bannerForm}
          onFormChange={setBannerForm}
          onSave={saveBanner}
          onCancel={() => {
            setShowBannerForm(false);
            resetBannerForm();
          }}
        />
      )}

      {/* Banners List */}
      <div className="space-y-3">
        {banners.map((banner, index) => (
          <BannerListItem
            key={banner.bannerID}
            banner={banner}
            index={index}
            isDragging={dragIndex === index}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onEdit={() => openEditForm(banner)}
            onToggleActive={() => toggleActive(banner.bannerID)}
            onRemove={() => removeBanner(banner.bannerID)}
          />
        ))}

        {banners.length === 0 && (
          <FallbackBannerPreview onResetToDefaults={resetToDefaults} />
        )}
      </div>
    </div>
  );
}


import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";
import { translations, Language } from "../../../translations";

import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { EditProfileFormSections } from "../edit/EditProfileFormSections";
import {
  applyProfileFieldChange,
  createInitialEditProfileForm,
  normalizeJordanPhoneInput,
  validateEditProfileForm,
} from "../edit/editProfileUtils";
import type {
  EditProfileFormProfile,
  EditProfileValidationErrors,
} from "../types";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";

import { api } from "../../../services/api";

type UserProfile = EditProfileFormProfile;

interface EditProfilePageProps {
  onBack: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void> | void;
  language: Language;
}

export function EditProfilePage({
  onBack,
  profile,
  onSave,
  language,
}: EditProfilePageProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserProfile>(() =>
    createInitialEditProfileForm(profile),
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<EditProfileValidationErrors>({});
  const { cityNames, areaNames, isLoadingCities, isLoadingAreas } =
    useLocationOptions(formData.city, language);
  const cityOptions = useMemo(() => {
    const normalizedOptionSet = new Set(
      cityNames
        .map((city) => city.trim().toLocaleLowerCase())
        .filter((city) => city.length > 0),
    );
    const normalizedCurrentCity = formData.city.trim();
    if (
      normalizedCurrentCity &&
      !normalizedOptionSet.has(normalizedCurrentCity.toLocaleLowerCase())
    ) {
      return [normalizedCurrentCity, ...cityNames];
    }

    return cityNames;
  }, [cityNames, formData.city]);
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

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setFormData((current) => {
      const next = applyProfileFieldChange(current, field, value);
      if (field === "city" && value !== current.city) {
        return applyProfileFieldChange(next, "area", "");
      }
      return next;
    });
    setHasChanges(true);
  };

  const handlePhoneChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      phone: normalizeJordanPhoneInput(value),
    }));
    setHasChanges(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        t.fileSizeTooLarge || "File size too large. Maximum size is 10MB.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        t.invalidFileType || "Please select an image file (JPG, PNG, or GIF).",
      );
      return;
    }

    setAvatarFile(file);
    setAvatarChanged(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      handleFieldChange("avatar", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    setAvatarFile(null);
    setAvatarChanged(true);
    handleFieldChange("avatar", "");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    const validationErrors = validateEditProfileForm(formData, language);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(
        language === "ar"
          ? "يرجى تصحيح الأخطاء قبل الحفظ"
          : "Please fix the errors before saving",
      );
      return;
    }

    setErrors({});
    
    // Process save with potential file upload
    const doSave = async () => {
      let finalAvatarUrl = formData.avatar;
      
      if (avatarFile) {
        try {
          const resolvedUserId = profile.id || String(profile.id);
          const uploadResult = await api.users.uploadAvatar(resolvedUserId, avatarFile);
          if (uploadResult && uploadResult.avatarUrl) {
            finalAvatarUrl = uploadResult.avatarUrl;
          }
        } catch (error) {
          toast.error(
            language === "ar"
              ? "فشل في رفع الصورة"
              : "Failed to upload image"
          );
          return;
        }
      }

      // If they removed the photo, or if they just kept their google photo
      const isValidAvatarUrl =
        !avatarFile &&
        finalAvatarUrl &&
        (finalAvatarUrl.startsWith("http://") || finalAvatarUrl.startsWith("https://") || finalAvatarUrl.startsWith("/uploads/"));

      const nextAvatarValue = avatarChanged
        ? (isValidAvatarUrl ? finalAvatarUrl : (avatarFile ? finalAvatarUrl : ""))
        : (profile.avatar || "");

      const dataToSave = {
        ...formData,
        avatar: nextAvatarValue,
      };

      const savePromise = onSave(dataToSave);
      if (savePromise instanceof Promise) {
        await savePromise;
      }
      setHasChanges(false);
      setAvatarFile(null);
      setAvatarChanged(false);
    };

    doSave().catch(() => {});
  };

  const handleCancel = () => {
    setFormData(createInitialEditProfileForm(profile));
    setErrors({});
    setHasChanges(false);
    setAvatarChanged(false);
    onBack();
  };

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={handleCancel}
        isRTL={isRTL}
        backLabel={t.cancel || "Cancel"}
        showLogo={false}
        title={t.editProfile || "Edit Profile"}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditProfileFormSections
          language={language}
          formData={formData}
          errors={errors}
          cities={cityOptions}
          areaSuggestions={areaSuggestions}
          isLoadingCities={isLoadingCities}
          isLoadingAreas={isLoadingAreas}
          hasChanges={hasChanges}
          fileInputRef={fileInputRef}
          onFieldChange={handleFieldChange}
          onPhoneChange={handlePhoneChange}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={handlePhotoRemove}
          onUploadClick={handleUploadClick}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </PageShell>
  );
}

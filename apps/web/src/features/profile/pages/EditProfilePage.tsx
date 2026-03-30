import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMemo, useRef, useState } from "react";
import { translations, Language } from "../../../translations";
import { Button } from "../../../shared/ui/button";
import { Save } from "lucide-react";
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        t.fileSizeTooLarge || "File size too large. Maximum size is 5MB.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(
        t.invalidFileType || "Please select an image file (JPG, PNG, or GIF).",
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleFieldChange("avatar", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
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
    const savePromise = onSave(formData);

    if (savePromise instanceof Promise) {
      savePromise
        .then(() => {
          setHasChanges(false);
        })
        .catch(() => {
          // Error toast is handled by route-level save action.
        });
      return;
    }

    setHasChanges(false);
  };

  const handleCancel = () => {
    setFormData(createInitialEditProfileForm(profile));
    setErrors({});
    setHasChanges(false);
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
        rightContent={hasChanges ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className={`w-4 h-4 me-2`} />
              {t.saveChanges || "Save Changes"}
            </Button>
          </motion.div>
        ) : null}
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

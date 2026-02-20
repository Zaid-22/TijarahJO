import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { translations, Language } from "../translations";
import { Button } from "../shared/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { EditProfileFormSections } from "../features/profile/edit/EditProfileFormSections";
import {
  applyProfileFieldChange,
  createInitialEditProfileForm,
  JORDANIAN_CITIES,
  normalizeJordanPhoneInput,
  validateEditProfileForm,
} from "../features/profile/edit/editProfileUtils";
import type {
  EditProfileFormProfile,
  EditProfileValidationErrors,
} from "../features/profile/types";

export type UserProfile = EditProfileFormProfile;

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

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setFormData((current) => applyProfileFieldChange(current, field, value));
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
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111111] shadow-sm border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-[#0A4ABF] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-105 -ml-2"
              >
                <ArrowLeft className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                <span>{t.cancel || "Cancel"}</span>
              </Button>
              <h1 className="text-black dark:text-white">
                {t.editProfile || "Edit Profile"}
              </h1>
            </div>

            {hasChanges ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSave}
                  className="bg-[#0A4ABF] text-white hover:bg-[#083a95]"
                >
                  <Save className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.saveChanges || "Save Changes"}
                </Button>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EditProfileFormSections
          language={language}
          formData={formData}
          errors={errors}
          cities={JORDANIAN_CITIES}
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
    </div>
  );
}

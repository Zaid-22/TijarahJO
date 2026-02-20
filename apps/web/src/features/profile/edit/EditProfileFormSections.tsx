import type { ChangeEvent, RefObject } from "react";
import { Save, Camera, Upload, X } from "lucide-react";
import { translations, type Language } from "../../../translations";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Textarea } from "../../../shared/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import type {
  EditProfileFormProfile,
  EditProfileValidationErrors,
} from "../types";

interface EditProfileFormSectionsProps {
  language: Language;
  formData: EditProfileFormProfile;
  errors: EditProfileValidationErrors;
  cities: readonly string[];
  hasChanges: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onFieldChange: (field: keyof EditProfileFormProfile, value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  onUploadClick: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function EditProfileFormSections({
  language,
  formData,
  errors,
  cities,
  hasChanges,
  fileInputRef,
  onFieldChange,
  onPhoneChange,
  onPhotoUpload,
  onPhotoRemove,
  onUploadClick,
  onCancel,
  onSave,
}: EditProfileFormSectionsProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const saveButtonClassName = hasChanges
    ? "bg-[#0A4ABF] text-white hover:bg-[#083a95]"
    : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.profilePicture || "Profile Picture"}</CardTitle>
          <CardDescription>
            {t.profilePictureDesc || "Update your profile photo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback className="text-2xl bg-[#0A4ABF20] text-[#0A4ABF]">
                  {formData.firstName?.[0] || ""}
                  {formData.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                aria-label={t.uploadPhoto || "Upload Photo"}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-[#0A4ABF] text-white"
                onClick={onUploadClick}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#0A4ABF] text-[#0A4ABF]"
                  onClick={onUploadClick}
                >
                  <Upload className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.uploadPhoto || "Upload Photo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={onPhotoRemove}
                >
                  <X className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.removePhoto || "Remove"}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t.photoRequirements || "JPG, PNG or GIF. Max size 5MB."}
              </p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={onPhotoUpload}
            accept="image/*"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.personalInformation || "Personal Information"}</CardTitle>
          <CardDescription>
            {t.personalInformationDesc || "Update your personal details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {t.firstName || "First Name"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => onFieldChange("firstName", e.target.value)}
                placeholder={t.enterFirstName || "Enter your first name"}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName ? (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">
                {t.middleName || "Middle Name"}{" "}
                <span className="text-gray-400 text-xs">
                  ({language === "ar" ? "اختياري" : "optional"})
                </span>
              </Label>
              <Input
                id="middleName"
                value={formData.middleName || ""}
                onChange={(e) => onFieldChange("middleName", e.target.value)}
                placeholder={t.enterMiddleName || "Enter your middle name"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                {t.lastName || "Last Name"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => onFieldChange("lastName", e.target.value)}
                placeholder={t.enterLastName || "Enter your last name"}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName ? (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t.phone || "Phone Number"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={t.enterPhone || "+962"}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone ? <p className="text-red-500 text-sm">{errors.phone}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              {t.city || "City"} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.city} onValueChange={(value) => onFieldChange("city", value)}>
              <SelectTrigger id="city" className={errors.city ? "border-red-500" : ""}>
                <SelectValue placeholder={t.selectCity || "Select your city"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city ? <p className="text-red-500 text-sm">{errors.city}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">
              {t.area || "Area"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => onFieldChange("area", e.target.value)}
              placeholder={t.enterArea || "Enter your area"}
              className={errors.area ? "border-red-500" : ""}
            />
            {errors.area ? <p className="text-red-500 text-sm">{errors.area}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t.bio || "Bio"}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => onFieldChange("bio", e.target.value)}
              placeholder={t.enterBio || "Tell us about yourself and what you sell..."}
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 text-right">
              {formData.bio.length}/500 {t.characters || "characters"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.accountStatistics || "Account Statistics"}</CardTitle>
          <CardDescription>
            {t.accountStatisticsDesc || "Your performance and activity"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="text-sm text-gray-600">{t.memberSince || "Member since"}</div>
              <div className="text-[#0A4ABF]">{formData.joinedDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.cancel || "Cancel"}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!hasChanges}
          className={saveButtonClassName}
        >
          <Save className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t.saveChanges || "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

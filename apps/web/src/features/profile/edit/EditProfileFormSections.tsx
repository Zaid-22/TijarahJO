import type { ChangeEvent, RefObject } from "react";
import { Save, Camera, Upload, User, X } from "lucide-react";
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
  areaSuggestions?: readonly string[];
  isLoadingCities?: boolean;
  isLoadingAreas?: boolean;
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
  areaSuggestions = [],
  isLoadingCities = false,
  isLoadingAreas = false,
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

  const saveButtonClassName = hasChanges
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted";

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
                <AvatarImage src={formData.avatar} className="object-cover object-center" />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-9 w-9" />
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                aria-label={t.uploadPhoto || "Upload Photo"}
                variant="default"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                onClick={onUploadClick}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary text-primary"
                  onClick={onUploadClick}
                >
                  <Upload className={`w-4 h-4 me-2`} />
                  {t.uploadPhoto || "Upload Photo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onPhotoRemove}
                >
                  <X className={`w-4 h-4 me-2`} />
                  {t.removePhoto || "Remove"}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
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
                {t.firstName || "First Name"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => onFieldChange("firstName", e.target.value)}
                placeholder={t.enterFirstName || "Enter your first name"}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName ? (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">
                {t.middleName || "Middle Name"}{" "}
                <span className="text-xs text-muted-foreground">
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
                {t.lastName || "Last Name"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => onFieldChange("lastName", e.target.value)}
                placeholder={t.enterLastName || "Enter your last name"}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName ? (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t.phone || "Phone Number"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={t.enterPhone || "+962"}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">
              {t.city || "City"} <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.city} onValueChange={(value) => onFieldChange("city", value)}>
              <SelectTrigger id="city" className={errors.city ? "border-destructive" : ""}>
                <SelectValue placeholder={t.selectCity || "Select your city"} />
              </SelectTrigger>
              <SelectContent>
                {cities.length > 0 ? (
                  cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_profile_cities__" disabled>
                    {isLoadingCities
                      ? language === "ar"
                        ? "جارٍ تحميل المدن..."
                        : "Loading cities..."
                      : language === "ar"
                        ? "لا توجد مدن متاحة"
                        : "No cities available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.city ? <p className="text-sm text-destructive">{errors.city}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">
              {t.area || "Area"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="area"
              list="edit-profile-area-options"
              value={formData.area}
              onChange={(e) => onFieldChange("area", e.target.value)}
              placeholder={t.enterArea || "Enter your area"}
              className={errors.area ? "border-destructive" : ""}
            />
            {areaSuggestions.length > 0 ? (
              <datalist id="edit-profile-area-options">
                {areaSuggestions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </datalist>
            ) : null}
            {isLoadingAreas ? (
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "جارٍ تحميل المناطق..." : "Loading areas..."}
              </p>
            ) : null}
            {errors.area ? <p className="text-sm text-destructive">{errors.area}</p> : null}
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
            <p className="text-right text-sm text-muted-foreground">
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
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <div className="text-sm text-muted-foreground">{t.memberSince || "Member since"}</div>
              <div className="text-primary">{formData.joinedDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.cancel || "Cancel"}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!hasChanges}
          className={saveButtonClassName}
        >
          <Save className={`w-4 h-4 me-2`} />
          {t.saveChanges || "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

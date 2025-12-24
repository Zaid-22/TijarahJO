import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { translations, Language } from "../../translations";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowLeft, Save, Camera, Upload, X } from "lucide-react";

export interface UserProfile {
  id: string;
  name: string; // Computed from firstName + middleName + lastName
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  location: string; // Computed from city + area
  bio: string;
  avatar?: string;
  joinedDate: string;
}

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

  const [formData, setFormData] =
    useState<UserProfile>({
      ...profile,
      phone: profile.phone || '+962',
      city: profile.city || '',
      area: profile.area || '',
      name: `${profile.firstName} ${profile.middleName || ''} ${profile.lastName}`.trim()
    });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Debug: Log initial form data
  console.log("[EditProfilePage] Initial profile:", profile);
  console.log("[EditProfilePage] Initial formData:", formData);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    city?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleChange = (
    field: keyof UserProfile,
    value: string | number,
  ) => {
    const updates: Partial<UserProfile> = { [field]: value };
    
    // If firstName, middleName, or lastName changes, update the computed name field
    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value as string : formData.firstName;
      const middleName = field === 'middleName' ? value as string : formData.middleName || '';
      const lastName = field === 'lastName' ? value as string : formData.lastName;
      updates.name = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
    }
    
    // If city or area changes, update the computed location field
    if (field === 'city' || field === 'area') {
      const city = field === 'city' ? value as string : formData.city;
      const area = field === 'area' ? value as string : formData.area;
      updates.location = area ? `${city}, ${area}` : city;
    }
    
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers (strip all non-digits)
    const digitsOnly = value.replace(/\D/g, '');
    
    // Keep only the digits after 962
    if (digitsOnly.startsWith('962')) {
      const phoneNumber = digitsOnly.slice(3);
      // Limit to 9 digits
      const limitedDigits = phoneNumber.slice(0, 9);
      setFormData((prev) => ({ ...prev, phone: `+962${limitedDigits}` }));
    } else {
      // If user tries to delete prefix, just update the number part
      const limitedDigits = digitsOnly.slice(0, 9);
      setFormData((prev) => ({ ...prev, phone: `+962${limitedDigits}` }));
    }
    setHasChanges(true);
  };

  const handlePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(
          t.fileSizeTooLarge ||
            "File size too large. Maximum size is 5MB.",
        );
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert(
          t.invalidFileType ||
            "Please select an image file (JPG, PNG, or GIF).",
        );
        return;
      }

      // Create a URL for the uploaded image
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("avatar", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    handleChange("avatar", "");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    console.log("[EditProfilePage] handleSave called");
    console.log("[EditProfilePage] formData:", formData);
    
    // Validate form data
    const newErrors: typeof errors = {};
    
    // Required fields validation
    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = language === "ar" 
        ? "الاسم الأول مطلوب"
        : "First name is required";
      console.log("[EditProfilePage] Validation error: First name is required");
    }
    
    if (!formData.lastName || !formData.lastName.trim()) {
      newErrors.lastName = language === "ar"
        ? "اسم العائلة مطلوب" 
        : "Last name is required";
      console.log("[EditProfilePage] Validation error: Last name is required");
    }
    
    // City is optional - only validate if user tries to set it but it's invalid
    // Note: City is not stored in database, so we don't require it
    // if (!formData.city || formData.city.trim() === "") {
    //   newErrors.city = language === "ar"
    //     ? "المدينة مطلوبة"
    //     : "City is required";
    //   console.log("[EditProfilePage] Validation error: City is required, current value:", formData.city);
    // }
    
    // Phone validation (optional but must be valid if provided)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    // Only validate if user has entered more than just the +962 prefix
    if (formData.phone && phoneDigits.length > 3) {
      // Phone should have exactly 12 digits (962 + 9 digits)
      if (phoneDigits.length !== 12) {
        newErrors.phone = language === "ar"
          ? "رقم الهاتف يجب أن يكون 9 أرقام بعد +962"
          : "Phone number must be 9 digits after +962";
      }
    }
    
    // If there are errors, show them and don't save
    if (Object.keys(newErrors).length > 0) {
      console.log("[EditProfilePage] Validation errors:", newErrors);
      setErrors(newErrors);
      toast.error(
        language === "ar"
          ? "يرجى تصحيح الأخطاء قبل الحفظ"
          : "Please fix the errors before saving"
      );
      return;
    }
    
    // Clear errors and save
    console.log("[EditProfilePage] Validation passed, calling onSave");
    setErrors({});
    
    // Call onSave - it will handle API call and navigation
    // Don't show toast here - let App.tsx handle it after successful API call
    const savePromise = onSave(formData);
    
    // Handle both sync and async onSave
    if (savePromise instanceof Promise) {
      savePromise
        .then(() => {
          console.log("[EditProfilePage] Save successful");
          setHasChanges(false);
        })
        .catch((error) => {
          console.error("[EditProfilePage] Error in onSave:", error);
          // Error toast is handled by App.tsx, but we keep hasChanges true so user can retry
        });
    } else {
      // Sync onSave
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setHasChanges(false);
    onBack();
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a]"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111111] shadow-sm border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                style={{ color: "#0A4ABF" }}
                className="hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-105 -ml-2"
              >
                <ArrowLeft
                  className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`}
                />
                <span>{t.cancel || "Cancel"}</span>
              </Button>
              <h1 className="text-black dark:text-white">
                {t.editProfile || "Edit Profile"}
              </h1>
            </div>

            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSave}
                  style={{
                    backgroundColor: "#0A4ABF",
                    color: "white",
                  }}
                  className="hover:opacity-90"
                >
                  <Save
                    className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                  />
                  {t.saveChanges || "Save Changes"}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t.profilePicture || "Profile Picture"}
              </CardTitle>
              <CardDescription>
                {t.profilePictureDesc ||
                  "Update your profile photo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback
                      className="text-2xl"
                      style={{
                        backgroundColor: "#0A4ABF20",
                        color: "#0A4ABF",
                      }}
                    >
                      {formData.firstName?.[0] || ''}{formData.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: "#0A4ABF",
                      color: "white",
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      style={{
                        borderColor: "#0A4ABF",
                        color: "#0A4ABF",
                      }}
                      onClick={handleUploadClick}
                    >
                      <Upload
                        className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                      />
                      {t.uploadPhoto || "Upload Photo"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handlePhotoRemove}
                    >
                      <X
                        className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                      />
                      {t.removePhoto || "Remove"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {t.photoRequirements ||
                      "JPG, PNG or GIF. Max size 5MB."}
                  </p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoUpload}
                accept="image/*"
              />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t.personalInformation ||
                  "Personal Information"}
              </CardTitle>
              <CardDescription>
                {t.personalInformationDesc ||
                  "Update your personal details"}
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
                    onChange={(e) =>
                      handleChange("firstName", e.target.value)
                    }
                    placeholder={
                      t.enterFirstName || "Enter your first name"
                    }
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">
                    {t.middleName || "Middle Name"} <span className="text-gray-400 text-xs">({language === "ar" ? "اختياري" : "optional"})</span>
                  </Label>
                  <Input
                    id="middleName"
                    value={formData.middleName || ''}
                    onChange={(e) =>
                      handleChange("middleName", e.target.value)
                    }
                    placeholder={
                      t.enterMiddleName || "Enter your middle name"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t.lastName || "Last Name"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleChange("lastName", e.target.value)
                    }
                    placeholder={
                      t.enterLastName || "Enter your last name"
                    }
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t.phone || "Phone Number"} <span className="text-gray-400 text-xs">({language === "ar" ? "اختياري" : "optional"})</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value)
                  }
                  placeholder={
                    t.enterPhone || "+962"
                  }
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  {t.city || "City"} <span className="text-gray-400 text-xs">({language === "ar" ? "اختياري" : "optional"})</span>
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) =>
                    handleChange("city", value)
                  }
                >
                  <SelectTrigger id="city" className={errors.city ? "border-red-500" : ""}>
                    <SelectValue
                      placeholder={
                        t.selectCity ||
                        "Select your city"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {jordanianCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">
                  {t.area || "Area"} <span className="text-gray-400 text-xs">({language === "ar" ? "اختياري" : "optional"})</span>
                </Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) =>
                    handleChange("area", e.target.value)
                  }
                  placeholder={
                    t.enterArea || "Enter your area"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t.bio || "Bio"}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    handleChange("bio", e.target.value)
                  }
                  placeholder={
                    t.enterBio ||
                    "Tell us about yourself and what you sell..."
                  }
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 text-right">
                  {formData.bio.length}/500{" "}
                  {t.characters || "characters"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t.accountStatistics || "Account Statistics"}
              </CardTitle>
              <CardDescription>
                {t.accountStatisticsDesc ||
                  "Your performance and activity"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div
                  className="text-center p-4 rounded-lg"
                  style={{ backgroundColor: "#F5F6FA" }}
                >
                  <div className="text-sm text-gray-600">
                    {t.memberSince || "Member since"}
                  </div>
                  <div style={{ color: "#0A4ABF" }}>
                    {formData.joinedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div
            className="flex items-center justify-end gap-3 pt-4 border-t"
            style={{ borderColor: "#E5E7EB" }}
          >
            <Button variant="outline" onClick={handleCancel}>
              {t.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              style={{
                backgroundColor: hasChanges
                  ? "#0A4ABF"
                  : "#E5E7EB",
                color: hasChanges ? "white" : "#9CA3AF",
                cursor: hasChanges ? "pointer" : "not-allowed",
              }}
            >
              <Save
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
              />
              {t.saveChanges || "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
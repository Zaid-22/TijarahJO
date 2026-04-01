import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MapPin, Phone, User } from "lucide-react";
import { api } from "../../../services/api";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import { useUserProfileContext } from "../../../contexts/UserProfileContext";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";
import { normalizeJordanPhone } from "../../../utils/phone";
import { DEFAULT_AVATAR_SRC } from "../../../shared/lib/avatar";
import { PageShell } from "../../../shared/ui/page-shell";
import { AuthInputField } from "../AuthInputField";
import { AuthPhoneField } from "../AuthPhoneField";
import { AuthSelectField } from "../AuthSelectField";
import { AuthAvatarUpload } from "../AuthAvatarUpload";
import { Alert, AlertDescription } from "../../../shared/ui/alert";
import { AlertCircle } from "lucide-react";

/** Returns true when the avatar is empty or is just the local default placeholder. */
function isPlaceholderAvatar(src: string | undefined | null): boolean {
  return !src || src === DEFAULT_AVATAR_SRC;
}

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const { userProfile, refreshProfile } = useUserProfileContext();
  const isRTL = language === "ar";

  const initialAvatar = isPlaceholderAvatar(userProfile?.avatar) ? "" : userProfile!.avatar;
  const [firstName, setFirstName] = useState(userProfile?.firstName || "");
  const [lastName, setLastName] = useState(userProfile?.lastName || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [city, setCity] = useState(userProfile?.city || "");
  const [area, setArea] = useState(userProfile?.area || "");
  const [avatarPreview, setAvatarPreview] = useState<string>(initialAvatar);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync profile data when it loads asynchronously (e.g. Google avatar URL)
  useEffect(() => {
    if (userProfile) {
      if (!firstName && userProfile.firstName) setFirstName(userProfile.firstName);
      if (!lastName && userProfile.lastName) setLastName(userProfile.lastName);
      if (!phone && userProfile.phone) setPhone(userProfile.phone);
      if (!city && userProfile.city) setCity(userProfile.city);
      if (!area && userProfile.area) setArea(userProfile.area);
      if (isPlaceholderAvatar(avatarPreview) && !isPlaceholderAvatar(userProfile.avatar)) {
        setAvatarPreview(userProfile.avatar);
      }
    }
  }, [userProfile, firstName, lastName, phone, city, area, avatarPreview]);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cities, areas, cityNames, areaNames, isLoadingCities, isLoadingAreas } =
    useLocationOptions(city, language);

  const prevCityRef = useRef(city);
  useEffect(() => {
    if (city !== prevCityRef.current) {
      prevCityRef.current = city;
      setArea("");
    }
  }, [city]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setGeneralError(
        isRTL
          ? "حجم الملف كبير جداً. الحد الأقصى هو 5 ميغابايت."
          : "File size too large. Maximum size is 5MB.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setGeneralError(
        isRTL
          ? "الرجاء اختيار صورة صالحة (JPG, PNG, GIF)."
          : "Please select an image file (JPG, PNG, or GIF).",
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const newErrors: Record<string, string> = {};
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const normalizedPhone = normalizeJordanPhone(phone);

    if (!trimmedFirstName) {
      newErrors.firstName = isRTL ? "الاسم الأول مطلوب" : "First name is required";
    }
    if (!trimmedLastName) {
      newErrors.lastName = isRTL ? "اسم العائلة مطلوب" : "Last name is required";
    }
    if (!normalizedPhone || normalizedPhone.length < 12) {
      newErrors.phone = isRTL ? "رقم هاتف أردني صحيح مطلوب" : "Valid Jordan phone required";
    }
    if (!city) {
      newErrors.city = isRTL ? "المدينة مطلوبة" : "City is required";
    }
    if (!area) {
      newErrors.area = isRTL ? "المنطقة مطلوبة" : "Area is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!userProfile?.id) {
      setGeneralError(isRTL ? "مستخدم غير صالح" : "Invalid user");
      return;
    }

    setIsLoading(true);
    try {
      const selectedCityObj = cities.find(c => c.cityName === city || c.cityNameAr === city);
      const resolvedCityId = selectedCityObj?.cityId;

      const selectedAreaObj = areas.find(a => a.areaName === area || a.areaNameAr === area);
      const resolvedAreaId = selectedAreaObj?.areaId;

      if (!resolvedCityId) {
        setGeneralError(
          isRTL ? "لم يتم العثور على المدينة" : "City not found",
        );
        return;
      }

      // Only send Avatar if it's a valid http/https URL (e.g. Google avatar).
      // Base64 data URLs from local file uploads are too large for the API
      // and will crash the server. They are only used for local preview.
      const isValidAvatarUrl =
        avatarPreview &&
        (avatarPreview.startsWith("http://") || avatarPreview.startsWith("https://"));

      await api.users.updateUser(userProfile.id, {
        FirstName: trimmedFirstName,
        LastName: trimmedLastName,
        Phone: normalizedPhone,
        CityId: resolvedCityId,
        AreaId: resolvedAreaId,
        Email: userProfile.email,
        ...(isValidAvatarUrl ? { Avatar: avatarPreview } : {}),
      });

      refreshProfile();
      navigate("/", { replace: true });
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : isRTL
            ? "حدث خطأ غير متوقع"
            : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const title = isRTL ? "أكمل ملفك الشخصي" : "Complete Your Profile";
  const subtitle = isRTL
    ? "الرجاء إكمال المعلومات التالية للمتابعة استخدام المنصة."
    : "Please complete the following information to continue using the platform.";

  const labels = {
    firstName: isRTL ? "الاسم الأول" : "First Name",
    lastName: isRTL ? "اسم العائلة" : "Last Name",
    phone: isRTL ? "رقم الهاتف" : "Phone Number",
    city: isRTL ? "المدينة" : "City",
    area: isRTL ? "المنطقة" : "Area",
    tapToUpload: isRTL ? "انقر لتحميل صورة" : "Tap to upload photo",
    uploadPhotoOptional: isRTL ? "صورة الملف الشخصي (اختياري)" : "Profile Photo (Optional)",
    saveAndContinue: isRTL ? "حفظ ومتابعة" : "Save and Continue",
  };

  return (
    <PageShell tone="account">
      <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
            >
              <User className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8"
          >
            {generalError && (
              <Alert
                variant="destructive"
                className="mb-6"
                aria-live="polite"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {generalError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Avatar Upload */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarUpload}
                accept="image/*"
              />
              <AuthAvatarUpload
                avatarPreview={avatarPreview}
                onAvatarClick={() => fileInputRef.current?.click()}
                tapToUploadText={labels.tapToUpload}
                uploadPhotoOptionalText={labels.uploadPhotoOptional}
              />

              {/* First Name + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInputField
                  id="firstName"
                  name="firstName"
                  label={labels.firstName}
                  required
                  placeholder={isRTL ? "أدخل الاسم الأول" : "Enter first name"}
                  value={firstName}
                  error={errors.firstName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="given-name"
                  icon={User}
                  focused={focusedField === "firstName"}
                  onChange={setFirstName}
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => setFocusedField(null)}
                  isRTL={isRTL}
                />
                <AuthInputField
                  id="lastName"
                  name="lastName"
                  label={labels.lastName}
                  required
                  placeholder={isRTL ? "أدخل اسم العائلة" : "Enter last name"}
                  value={lastName}
                  error={errors.lastName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="family-name"
                  icon={User}
                  focused={focusedField === "lastName"}
                  onChange={setLastName}
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => setFocusedField(null)}
                  isRTL={isRTL}
                />
              </div>

              {/* Phone */}
              <AuthPhoneField
                id="phone"
                name="phone"
                label={labels.phone}
                required
                placeholder={isRTL ? "7XXXXXXXX" : "7XXXXXXXX"}
                value={phone}
                error={errors.phone}
                disabled={isLoading}
                icon={Phone}
                focused={focusedField === "phone"}
                onChange={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                isRTL={isRTL}
              />

              {/* City */}
              <AuthSelectField
                id="city"
                name="city"
                label={labels.city}
                required
                icon={MapPin}
                focused={focusedField === "city"}
                onFocus={() => setFocusedField("city")}
                onBlur={() => setFocusedField(null)}
                isRTL={isRTL}
                value={city}
                error={errors.city}
                disabled={isLoading || isLoadingCities || cityNames.length === 0}
                options={cityNames.map((name) => ({ value: name, label: name }))}
                onChange={(val) => {
                  setCity(val);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                }}
              />

              {/* Area */}
              <AuthSelectField
                id="area"
                name="area"
                label={labels.area}
                required
                icon={MapPin}
                focused={focusedField === "area"}
                onFocus={() => setFocusedField("area")}
                onBlur={() => setFocusedField(null)}
                isRTL={isRTL}
                value={area}
                error={errors.area}
                disabled={isLoading || !city || isLoadingAreas}
                options={areaNames.map((name) => ({ value: name, label: name }))}
                onChange={(val) => {
                  setArea(val);
                  if (errors.area) setErrors((prev) => ({ ...prev, area: "" }));
                }}
              />

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full h-12 sm:h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  labels.saveAndContinue
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            {isRTL
              ? "هذه المعلومات مطلوبة لتفعيل حسابك بالكامل."
              : "This information is required to fully activate your account."}
          </motion.p>
        </motion.div>
      </div>
    </PageShell>
  );
}

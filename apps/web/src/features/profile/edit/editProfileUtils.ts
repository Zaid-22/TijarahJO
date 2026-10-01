import type { Language } from "../../../translations";
import type {
  EditProfileFormProfile,
  EditProfileValidationErrors,
} from "../types";

const JORDAN_DIALING_PREFIX = "962";
const MAX_JORDAN_PHONE_DIGITS = 9;

function composeName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
}

function composeLocation(city: string, area: string): string {
  const normalizedCity = city.trim();
  const normalizedArea = area.trim();
  return normalizedArea ? `${normalizedCity}, ${normalizedArea}` : normalizedCity;
}

export function createInitialEditProfileForm(
  profile: EditProfileFormProfile,
): EditProfileFormProfile {
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const city = profile.city || "";
  const area = profile.area || "";

  return {
    ...profile,
    firstName,
    lastName,
    phone: profile.phone || "+962",
    city,
    area,
    name: composeName(firstName, lastName),
    location: composeLocation(city, area),
  };
}

export function applyProfileFieldChange(
  formData: EditProfileFormProfile,
  field: keyof EditProfileFormProfile,
  value: string,
): EditProfileFormProfile {
  const nextFormData: EditProfileFormProfile = {
    ...formData,
    [field]: value,
  };

  if (field === "firstName" || field === "lastName") {
    nextFormData.name = composeName(
      field === "firstName" ? value : formData.firstName,
      field === "lastName" ? value : formData.lastName,
    );
  }

  if (field === "city" || field === "area") {
    nextFormData.location = composeLocation(
      field === "city" ? value : formData.city,
      field === "area" ? value : formData.area,
    );
  }

  return nextFormData;
}

export function normalizeJordanPhoneInput(value: string): string {
  if (!value || "+962".startsWith(value)) {
    return "+962";
  }

  if (value.startsWith("+962")) {
    const localPart = value.slice(4).replace(/\D/g, "");
    return `+962${localPart.slice(0, MAX_JORDAN_PHONE_DIGITS)}`;
  }

  const digitsOnly = value.replace(/\D/g, "");
  const hasPrefix = digitsOnly.startsWith(JORDAN_DIALING_PREFIX);
  const localNumber = hasPrefix
    ? digitsOnly.slice(JORDAN_DIALING_PREFIX.length)
    : digitsOnly;
  const normalizedLocalNumber = localNumber.slice(0, MAX_JORDAN_PHONE_DIGITS);

  return `+${JORDAN_DIALING_PREFIX}${normalizedLocalNumber}`;
}

export function validateEditProfileForm(
  formData: EditProfileFormProfile,
  language: Language,
): EditProfileValidationErrors {
  const errors: EditProfileValidationErrors = {};

  if (!formData.firstName.trim()) {
    errors.firstName =
      language === "ar" ? "الاسم الأول مطلوب" : "First name is required";
  }

  if (!formData.lastName.trim()) {
    errors.lastName =
      language === "ar" ? "اسم العائلة مطلوب" : "Last name is required";
  }

  if (formData.city.trim() && !formData.area.trim()) {
    errors.area =
      language === "ar"
        ? "المنطقة مطلوبة عند تحديد المدينة"
        : "Area is required when a city is selected";
  }

  const phoneDigits = formData.phone.replace(/\D/g, "");
  if (!formData.phone || phoneDigits.length <= JORDAN_DIALING_PREFIX.length) {
    errors.phone =
      language === "ar" ? "رقم الهاتف مطلوب" : "Phone number is required";
  } else if (
    phoneDigits.length !== JORDAN_DIALING_PREFIX.length + MAX_JORDAN_PHONE_DIGITS
  ) {
    errors.phone =
      language === "ar"
        ? "رقم الهاتف يجب أن يكون 9 أرقام بعد +962"
        : "Phone number must be 9 digits after +962";
  }

  return errors;
}

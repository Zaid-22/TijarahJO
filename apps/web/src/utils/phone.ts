import { APP_CONFIG } from "../constants/appConfig";

const PHONE_PREFIX_DIGITS = APP_CONFIG.defaultPhonePrefix.replace(/\D/g, "");

export function normalizeJordanPhone(value: string): string | null {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return null;
  }

  let localNumber = digitsOnly;

  if (PHONE_PREFIX_DIGITS && localNumber.startsWith(PHONE_PREFIX_DIGITS)) {
    localNumber = localNumber.slice(PHONE_PREFIX_DIGITS.length);
  }

  if (localNumber.startsWith("0") && localNumber.length === 10) {
    localNumber = localNumber.slice(1);
  }
  // At this point, if it was directly entered from the form, it will be 9 digits starting with 7
  // e.g., 79xxxxxxx, 78xxxxxxx, 77xxxxxxx => 9 digits
  if (!/^7[789]\d{7}$/.test(localNumber)) {
    return null;
  }

  return `${APP_CONFIG.defaultPhonePrefix}${localNumber}`;
}

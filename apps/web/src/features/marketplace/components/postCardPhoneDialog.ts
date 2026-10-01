import type { Language } from "../../../types";

export type PhoneLookupStatus = "idle" | "ready" | "unavailable" | "error";

type PhoneDialogCopy = {
  title: string;
  description: string;
  displayNumber: string;
  canCall: boolean;
  callNowLabel: string;
  closeLabel: string;
};

export function resolvePhoneDialogCopy(
  language: Language,
  phone: string,
  status: PhoneLookupStatus,
): PhoneDialogCopy {
  const isArabic = language === "ar";
  const trimmedPhone = phone.trim();

  const title = isArabic ? "رقم الهاتف" : "Phone Number";
  const callNowLabel = isArabic ? "اتصل الآن" : "Call Now";
  const closeLabel = isArabic ? "إغلاق" : "Close";

  if (status === "ready" && trimmedPhone) {
    return {
      title,
      description: isArabic
        ? "اضغط على الزر للاتصال بالبائع"
        : "Use the button below to call the seller",
      displayNumber: trimmedPhone,
      canCall: true,
      callNowLabel,
      closeLabel,
    };
  }

  if (status === "unavailable") {
    return {
      title,
      description: isArabic
        ? "رقم الهاتف غير متوفر لهذا البائع"
        : "Phone number is not available for this seller",
      displayNumber: isArabic ? "غير متوفر" : "Unavailable",
      canCall: false,
      callNowLabel,
      closeLabel,
    };
  }

  return {
    title,
    description: isArabic
      ? "تعذر تحميل رقم الهاتف الآن. حاول مرة أخرى."
      : "We couldn't load the phone number right now. Please try again.",
    displayNumber: isArabic ? "غير متاح حالياً" : "Unavailable right now",
    canCall: false,
    callNowLabel,
    closeLabel,
  };
}

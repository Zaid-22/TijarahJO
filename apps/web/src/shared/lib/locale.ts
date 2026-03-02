import type { Language } from "../../types";

export function resolveDocumentLanguage(fallback: Language = "en"): Language {
  if (typeof document === "undefined") {
    return fallback;
  }

  const normalizedLang = String(document.documentElement.lang || "")
    .trim()
    .toLowerCase();

  if (normalizedLang.startsWith("ar")) {
    return "ar";
  }

  if (normalizedLang.startsWith("en")) {
    return "en";
  }

  return fallback;
}


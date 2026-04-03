import type { Category } from "../../types/api";
import type { Language } from "../../types";

export function resolveCategoryName(
  category: Category,
  language: Language,
): string {
  if (language === "ar" && category.nameAr.trim().length > 0) {
    return category.nameAr;
  }

  return category.name;
}

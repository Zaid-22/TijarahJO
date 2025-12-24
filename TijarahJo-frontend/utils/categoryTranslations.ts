import { translations, Language } from "../translations";

export function getCategoryTranslation(categoryName: string, language: Language): string {
  const t = translations[language];
  
  // Direct match
  if (t[categoryName as keyof typeof t]) {
    return t[categoryName as keyof typeof t] as string;
  }
  
  // Return original if no translation found
  return categoryName;
}

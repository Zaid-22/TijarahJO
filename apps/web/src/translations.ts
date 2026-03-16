import { Language } from "./types";
import { homeTranslations } from "./features/home/translations";
import { profileTranslations } from "./features/profile/translations";
import { marketplaceTranslations } from "./features/marketplace/translations";
import { sharedTranslations } from "./shared/translations";

export type { Language };

const enTranslations = {
  ...homeTranslations.en,
  ...profileTranslations.en,
  ...marketplaceTranslations.en,
  ...sharedTranslations.en,
};

const arTranslations = {
  ...homeTranslations.ar,
  ...profileTranslations.ar,
  ...marketplaceTranslations.ar,
  ...sharedTranslations.ar,
};

/** All valid translation keys inferred from the English translation map. */
export type TranslationKey = keyof typeof enTranslations;

/** Typed translation map — guarantees all keys exist. */
export type TranslationMap = Record<TranslationKey, string>;

export const translations: Record<Language, TranslationMap> = {
  en: enTranslations as TranslationMap,
  ar: arTranslations as TranslationMap,
};

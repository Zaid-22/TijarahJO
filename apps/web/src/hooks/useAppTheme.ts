import { useCallback, useLayoutEffect } from "react";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";
import { Language } from "../types";

function normalizeLanguage(value: unknown): Language {
  return value === "en" || value === "ar" ? value : "ar";
}

function normalizeDarkMode(value: unknown): boolean {
  return value === true;
}

export function useAppTheme() {
  const [storedDarkMode, setStoredDarkMode] = useLocalStorage<unknown>(
    "tijarahjo_dark_mode",
    false,
  );
  const [storedLanguage, setStoredLanguage] = useLocalStorage<unknown>(
    "tijarahjo_language",
    "ar",
  );
  const darkMode = normalizeDarkMode(storedDarkMode);
  const language = normalizeLanguage(storedLanguage);

  const isRTL = language === "ar";

  useLayoutEffect(() => {
    if (storedLanguage !== language) {
      setStoredLanguage(language);
    }
  }, [language, setStoredLanguage, storedLanguage]);

  useLayoutEffect(() => {
    if (storedDarkMode !== darkMode) {
      setStoredDarkMode(darkMode);
    }
  }, [darkMode, setStoredDarkMode, storedDarkMode]);

  useLayoutEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const setDarkMode = useCallback(
    (enabled: boolean) => {
      setStoredDarkMode(Boolean(enabled));
    },
    [setStoredDarkMode],
  );

  const setLanguage = useCallback(
    (value: Language | ((previous: Language) => Language)) => {
      setStoredLanguage((previousValue: unknown) => {
        const previousLanguage = normalizeLanguage(previousValue);
        const nextLanguage =
          value instanceof Function ? value(previousLanguage) : value;
        return normalizeLanguage(nextLanguage);
      });
    },
    [setStoredLanguage],
  );

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  return {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    toggleLanguage,
    isRTL,
  };
}

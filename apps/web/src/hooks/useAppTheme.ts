import { useLayoutEffect } from "react";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";
import { Language } from "../types";

export function useAppTheme() {
  const [darkMode, setDarkMode] = useLocalStorage("tijarahjo_dark_mode", false);
  const [language, setLanguage] = useLocalStorage<Language>(
    "tijarahjo_language",
    "ar",
  );

  const isRTL = language === "ar";

  useLayoutEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

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

import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { Language } from "../types";

export function useAppTheme() {
  const [darkMode, setDarkMode] = useLocalStorage("tijarahjo_dark_mode", false);
  const [language, setLanguage] = useLocalStorage<Language>(
    "tijarahjo_language",
    "en",
  );
  const [viewMode, setViewMode] = useLocalStorage<
    "grid-4" | "grid-3" | "grid-2" | "list"
  >("tijarahjo_view_mode", "grid-4");

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  return {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    viewMode,
    setViewMode,
    toggleLanguage,
    isRTL,
  };
}

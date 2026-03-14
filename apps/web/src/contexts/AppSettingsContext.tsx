import { createContext, ReactNode, useContext } from "react";
import { useAppTheme } from "../hooks/useAppTheme";
import { Language } from "../types";

interface AppSettingsContextType {
  language: Language;
  isRTL: boolean;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(
  undefined,
);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();

  return (
    <AppSettingsContext.Provider value={theme}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}

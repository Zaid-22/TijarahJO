import { Button } from "../shared/ui/button";
import { ArrowLeft } from "lucide-react";
import { Language } from "../translations";
import { settingsTranslations } from "../translations/settings";
import { STORAGE_KEYS } from "../constants";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";
import {
  defaultSettingsPreferences,
  SettingsPreferences,
} from "../features/settings/types";
import { SettingsContent } from "../features/settings/SettingsContent";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface SettingsPageProps {
  onBackToMarketplace: () => void;
  language?: Language;
  darkMode?: boolean;
  onDarkModeChange?: (enabled: boolean) => void;
  onLanguageChange?: () => void;
  onLogout?: () => void;
  userProfile: UserProfile;
  onEditProfileClick?: () => void;
}

export function SettingsPage({
  onBackToMarketplace,
  language = "en",
  darkMode = false,
  onDarkModeChange,
  onLanguageChange,
  onLogout,
  userProfile,
  onEditProfileClick,
}: SettingsPageProps) {
  const isRTL = language === "ar";
  const [settingsPreferences, setSettingsPreferences] =
    useLocalStorage<SettingsPreferences>(
      STORAGE_KEYS.SETTINGS_PREFERENCES,
      defaultSettingsPreferences,
    );

  const displayName = userProfile.name || "-";
  const displayEmail = userProfile.email || "-";
  const displayPhone = userProfile.phone || "-";
  const displayLocation = userProfile.location || "-";
  const text = settingsTranslations[language];

  const updatePreference =
    (key: keyof SettingsPreferences) => (value: boolean) => {
      setSettingsPreferences((previous) => ({
        ...previous,
        [key]: value,
      }));
    };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#1a1a1a]">
      <header className="sticky top-0 z-50 shadow-sm bg-[#0A4ABF] dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToMarketplace}
              className="text-white hover:bg-white/10 px-2 sm:px-4"
            >
              <ArrowLeft
                className={`w-5 h-5 ${isRTL ? "rotate-180 mr-2" : "mr-2"}`}
              />
              <span className="hidden sm:inline">{text.settings}</span>
            </Button>
            <h1 className="text-white text-lg sm:text-xl">{text.settings}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <SettingsContent
          language={language}
          isRTL={isRTL}
          darkMode={darkMode}
          onDarkModeChange={onDarkModeChange}
          onLanguageChange={onLanguageChange}
          onLogout={onLogout}
          onEditProfileClick={onEditProfileClick}
          text={text}
          settingsPreferences={settingsPreferences}
          updatePreference={updatePreference}
          displayName={displayName}
          displayEmail={displayEmail}
          displayPhone={displayPhone}
          displayLocation={displayLocation}
        />
      </div>
    </div>
  );
}

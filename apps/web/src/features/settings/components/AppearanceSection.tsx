import { Moon, Globe } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Separator } from "../../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { SettingsTranslations } from "../../../translations/settings";
import { SettingsActionRow } from "./NotificationsSettingsSection";
import type { Language } from "../../../types";

interface AppearanceSectionProps {
  text: SettingsTranslations;
  language: Language;
  darkMode: boolean;
  onDarkModeChange?: (enabled: boolean) => void;
  onLanguageChange?: () => void;
}

export function AppearanceSection({
  text,
  language,
  darkMode,
  onDarkModeChange,
  onLanguageChange,
}: AppearanceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{text.appearance}</CardTitle>
            <CardDescription>{text.appearanceDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsActionRow
          icon={Moon}
          controlId="settings-dark-mode"
          label={text.darkMode}
          description={text.darkModeDesc}
          checked={darkMode}
          onCheckedChange={onDarkModeChange ?? (() => {})}
          disabled={!onDarkModeChange}
        />
        <Separator />
        <SettingsActionRow
          icon={Globe}
          label={text.languageSetting}
          description={text.languageDesc}
          control={
            <Button
              variant="outline"
              size="sm"
              onClick={onLanguageChange}
              className="text-primary border-primary"
            >
              {language === "en" ? "العربية" : "English"}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}

import { Lock, Mail, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../../../shared/ui/button";
import { Switch } from "../../../shared/ui/switch";
import { Separator } from "../../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { SettingsTranslations } from "../../../translations/settings";
import type { SettingsPreferences } from "../types";
import { SettingsActionRow } from "./NotificationsSettingsSection";

interface PrivacySectionProps {
  text: SettingsTranslations;
  settingsPreferences: SettingsPreferences;
  updatePreference: (
    key: keyof SettingsPreferences,
  ) => (value: boolean) => void;
  twoFactorDescription?: string;
  twoFactorControl?: ReactNode;
}

export function PrivacySection({
  text,
  settingsPreferences,
  updatePreference,
  twoFactorDescription,
  twoFactorControl,
}: PrivacySectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{text.privacy}</CardTitle>
            <CardDescription>{text.privacyDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsActionRow
          icon={Mail}
          label={text.showEmail}
          description={text.showEmailDesc}
          control={
            <Switch
              checked={settingsPreferences.showEmail}
              onCheckedChange={updatePreference("showEmail")}
            />
          }
        />
        <Separator />
        <SettingsActionRow
          icon={Shield}
          label={text.twoFactor}
          description={twoFactorDescription ?? text.twoFactorDesc}
          control={
            twoFactorControl ?? (
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary"
                disabled
                title={text.comingSoon}
                aria-label={`${text.twoFactor} - ${text.comingSoon}`}
              >
                {text.comingSoon}
              </Button>
            )
          }
        />
      </CardContent>
    </Card>
  );
}

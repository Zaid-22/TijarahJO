import { Bell, Mail, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Switch } from "../../../shared/ui/switch";
import { Label } from "../../../shared/ui/label";
import { Separator } from "../../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { AppNotification, Language } from "../../../types";
import type { SettingsTranslations } from "../../../translations/settings";
import type { SettingsPreferences } from "../types";
import { SettingsNotificationsPreview } from "../SettingsNotificationsPreview";

interface SettingsActionRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  control: ReactNode;
}

export function SettingsActionRow({
  icon: Icon,
  label,
  description,
  control,
}: SettingsActionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" />
          <Label>{label}</Label>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  );
}

interface NotificationsSettingsSectionProps {
  text: SettingsTranslations;
  language: Language;
  settingsPreferences: SettingsPreferences;
  updatePreference: (
    key: keyof SettingsPreferences,
  ) => (value: boolean) => void;
  onPushNotificationsChange?: (value: boolean) => void;
  isPushNotificationsDisabled?: boolean;
  notifications: AppNotification[];
  isNotificationsLoading: boolean;
  isNotificationsMutationPending: boolean;
  onMarkNotificationAsRead?: (notificationId: number) => void;
  onMarkAllNotificationsAsRead?: () => void;
}

export function NotificationsSettingsSection({
  text,
  language,
  settingsPreferences,
  updatePreference,
  onPushNotificationsChange,
  isPushNotificationsDisabled,
  notifications,
  isNotificationsLoading,
  isNotificationsMutationPending,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}: NotificationsSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{text.notifications}</CardTitle>
            <CardDescription>{text.notificationsDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsActionRow
          icon={Mail}
          label={text.emailNotifications}
          description={text.emailNotificationsDesc}
          control={
            <Switch
              checked={settingsPreferences.emailNotifications}
              onCheckedChange={updatePreference("emailNotifications")}
            />
          }
        />
        <Separator />
        <SettingsActionRow
          icon={Bell}
          label={text.pushNotifications}
          description={text.pushNotificationsDesc}
          control={
            <Switch
              checked={settingsPreferences.pushNotifications}
              onCheckedChange={
                onPushNotificationsChange ??
                updatePreference("pushNotifications")
              }
              disabled={isPushNotificationsDisabled}
            />
          }
        />
        <Separator />
        <SettingsActionRow
          icon={Mail}
          label={text.messageNotifications}
          description={text.messageNotificationsDesc}
          control={
            <Switch
              checked={settingsPreferences.messageNotifications}
              onCheckedChange={updatePreference("messageNotifications")}
            />
          }
        />
        <Separator />
        <SettingsActionRow
          icon={Bell}
          label={text.newListings}
          description={text.newListingsDesc}
          control={
            <Switch
              checked={settingsPreferences.newListingNotifications}
              onCheckedChange={updatePreference("newListingNotifications")}
            />
          }
        />
        <Separator />
        <SettingsNotificationsPreview
          language={language}
          notifications={notifications}
          isLoading={isNotificationsLoading}
          isMutationPending={isNotificationsMutationPending}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
        />
      </CardContent>
    </Card>
  );
}

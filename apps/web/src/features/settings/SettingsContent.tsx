import { Button } from "../../shared/ui/button";
import { Label } from "../../shared/ui/label";
import { Switch } from "../../shared/ui/switch";
import { Separator } from "../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/ui/card";
import {
  User,
  Bell,
  Lock,
  MapPin,
  Globe,
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  Mail,
  Phone,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Language } from "../../translations";
import { SettingsTranslations } from "../../translations/settings";
import { SettingsPreferences } from "./types";
import type { AppNotification } from "../../types";
import { SettingsNotificationsPreview } from "./SettingsNotificationsPreview";
import { SavedSearchesSection } from "./SavedSearchesSection";

interface SettingsContentProps {
  language: Language;
  isRTL: boolean;
  darkMode: boolean;
  onDarkModeChange?: (enabled: boolean) => void;
  onLanguageChange?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void | Promise<void>;
  onEditProfileClick?: () => void;
  onOpenHelpCenter?: () => void;
  onContactSupport?: () => void;
  onReportIssue?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  text: SettingsTranslations;
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
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  displayLocation: string;
  twoFactorDescription?: string;
  twoFactorControl?: ReactNode;
  onNavigate?: (path: string) => void;
}

interface SettingsActionRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  control: ReactNode;
}

function SettingsActionRow({
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

export function SettingsContent({
  language,
  isRTL,
  darkMode,
  onDarkModeChange,
  onLanguageChange,
  onLogout,
  onDeleteAccount,
  onEditProfileClick,
  onOpenHelpCenter,
  onContactSupport,
  onReportIssue,
  onOpenTerms,
  onOpenPrivacy,
  text,
  settingsPreferences,
  updatePreference,
  onPushNotificationsChange,
  isPushNotificationsDisabled = false,
  notifications,
  isNotificationsLoading,
  isNotificationsMutationPending,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  displayName,
  displayEmail,
  displayPhone,
  displayLocation,
  twoFactorDescription,
  twoFactorControl,
  onNavigate,
}: SettingsContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle>{text.accountSettings}</CardTitle>
                <CardDescription className="break-words">
                  {text.accountDesc}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfileClick}
              className="w-full sm:w-auto whitespace-nowrap border-primary text-primary hover:bg-muted"
            >
              {text.editProfile || "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {text.fullName}
            </Label>
            <div className="text-foreground">{displayName}</div>
          </div>

          <Separator />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {text.email}
            </Label>
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 opacity-50" />
              {displayEmail}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {text.phone}
            </Label>
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="w-4 h-4 opacity-50" />
              {displayPhone}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              {text.currentLocation}
            </Label>
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="w-4 h-4 opacity-50" />
              {displayLocation}
            </div>
          </div>
        </CardContent>
      </Card>

      <SavedSearchesSection language={language} onNavigate={onNavigate} />

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
            label={text.darkMode}
            description={text.darkModeDesc}
            control={
              <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
            }
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{text.help}</CardTitle>
              <CardDescription>{text.helpDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onOpenHelpCenter}
          >
            <HelpCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.helpCenter}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onContactSupport}
          >
            <Mail className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.contactSupport}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onReportIssue}
          >
            <Shield className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.reportIssue}
          </Button>
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={onOpenTerms}
          >
            {text.termsOfService}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={onOpenPrivacy}
          >
            {text.privacyPolicy}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">
                {text.dangerZone}
              </CardTitle>
              <CardDescription>{text.dangerDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <LogOut className="w-4 h-4 text-destructive" />
                  <Label className="text-destructive">{text.logout}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {text.logoutDesc}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/15"
                onClick={onLogout}
                aria-label={text.logout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <Label className="text-destructive">
                    {text.deleteAccount}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {text.deleteAccountDesc}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/15"
                aria-label={text.deleteAccount}
                onClick={onDeleteAccount}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

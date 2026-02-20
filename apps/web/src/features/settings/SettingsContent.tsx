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
} from "lucide-react";
import { Language } from "../../translations";
import { SettingsTranslations } from "../../translations/settings";
import { SettingsPreferences } from "./types";

interface SettingsContentProps {
  language: Language;
  isRTL: boolean;
  darkMode: boolean;
  onDarkModeChange?: (enabled: boolean) => void;
  onLanguageChange?: () => void;
  onLogout?: () => void;
  onEditProfileClick?: () => void;
  text: SettingsTranslations;
  settingsPreferences: SettingsPreferences;
  updatePreference: (
    key: keyof SettingsPreferences,
  ) => (value: boolean) => void;
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  displayLocation: string;
}

export function SettingsContent({
  language,
  isRTL,
  darkMode,
  onDarkModeChange,
  onLanguageChange,
  onLogout,
  onEditProfileClick,
  text,
  settingsPreferences,
  updatePreference,
  displayName,
  displayEmail,
  displayPhone,
  displayLocation,
}: SettingsContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#0A4ABF20]">
                <User className="w-5 h-5 text-[#0A4ABF]" />
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
              className="hover:bg-blue-50 w-full sm:w-auto whitespace-nowrap text-[#0A4ABF] border-[#0A4ABF]"
            >
              {text.editProfile || "Edit Profile"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm opacity-60">{text.fullName}</Label>
            <div className="dark:text-white">{displayName}</div>
          </div>

          <Separator />
          <div className="space-y-2">
            <Label className="text-sm opacity-60">{text.email}</Label>
            <div className="flex items-center gap-2 dark:text-white">
              <Mail className="w-4 h-4 opacity-50" />
              {displayEmail}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm opacity-60">{text.phone}</Label>
            <div className="flex items-center gap-2 dark:text-white">
              <Phone className="w-4 h-4 opacity-50" />
              {displayPhone}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm opacity-60">{text.currentLocation}</Label>
            <div className="flex items-center gap-2 dark:text-white">
              <MapPin className="w-4 h-4 opacity-50" />
              {displayLocation}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FF634720]">
              <Bell className="w-5 h-5 text-[#FF6347]" />
            </div>
            <div>
              <CardTitle>{text.notifications}</CardTitle>
              <CardDescription>{text.notificationsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <Label>{text.emailNotifications}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.emailNotificationsDesc}</p>
            </div>
            <Switch
              checked={settingsPreferences.emailNotifications}
              onCheckedChange={updatePreference("emailNotifications")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4" />
                <Label>{text.pushNotifications}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.pushNotificationsDesc}</p>
            </div>
            <Switch
              checked={settingsPreferences.pushNotifications}
              onCheckedChange={updatePreference("pushNotifications")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <Label>{text.messageNotifications}</Label>
              </div>
              <p className="text-sm text-gray-500">
                {text.messageNotificationsDesc}
              </p>
            </div>
            <Switch
              checked={settingsPreferences.messageNotifications}
              onCheckedChange={updatePreference("messageNotifications")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4" />
                <Label>{text.newListings}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.newListingsDesc}</p>
            </div>
            <Switch
              checked={settingsPreferences.newListingNotifications}
              onCheckedChange={updatePreference("newListingNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#32CD3220]">
              <Lock className="w-5 h-5 text-[#32CD32]" />
            </div>
            <div>
              <CardTitle>{text.privacy}</CardTitle>
              <CardDescription>{text.privacyDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <Label>{text.showEmail}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.showEmailDesc}</p>
            </div>
            <Switch
              checked={settingsPreferences.showEmail}
              onCheckedChange={updatePreference("showEmail")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" />
                <Label>{text.twoFactor}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.twoFactorDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[#0A4ABF] border-[#0A4ABF]"
            >
              {text.enable}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FF69B420]">
              <Moon className="w-5 h-5 text-[#FF69B4]" />
            </div>
            <div>
              <CardTitle>{text.appearance}</CardTitle>
              <CardDescription>{text.appearanceDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4" />
                <Label>{text.darkMode}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.darkModeDesc}</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4" />
                <Label>{text.languageSetting}</Label>
              </div>
              <p className="text-sm text-gray-500">{text.languageDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLanguageChange}
              className="text-[#0A4ABF] border-[#0A4ABF]"
            >
              {language === "en" ? "العربية" : "English"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#8B451320]">
              <HelpCircle className="w-5 h-5 text-[#8B4513]" />
            </div>
            <div>
              <CardTitle>{text.help}</CardTitle>
              <CardDescription>{text.helpDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <HelpCircle className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.helpCenter}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Mail className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.contactSupport}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {text.reportIssue}
          </Button>
          <Separator />
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            {text.termsOfService}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600">
            {text.privacyPolicy}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">{text.dangerZone}</CardTitle>
              <CardDescription>{text.dangerDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <LogOut className="w-4 h-4 text-red-600" />
                  <Label className="text-red-600">{text.logout}</Label>
                </div>
                <p className="text-sm text-gray-600">{text.logoutDesc}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={onLogout}
                aria-label={text.logout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <Label className="text-red-600">{text.deleteAccount}</Label>
                </div>
                <p className="text-sm text-gray-600">{text.deleteAccountDesc}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                aria-label={text.deleteAccount}
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

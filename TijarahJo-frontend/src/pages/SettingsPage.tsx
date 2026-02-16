import { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
// import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ArrowLeft,
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
import { Language } from "../translations";

export interface UserProfile {
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

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [newListingNotifications, setNewListingNotifications] = useState(false);
  // const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const displayName = userProfile.name || "-";
  const displayEmail = userProfile.email || "-";
  const displayPhone = userProfile.phone || "-";
  const displayLocation = userProfile.location || "-";

  const t = {
    en: {
      settings: "Settings",
      accountSettings: "Account Settings",
      accountDesc: "Manage your account information and preferences",
      fullName: "Full Name",
      username: "Username",
      email: "Email Address",
      phone: "Phone Number",
      currentLocation: "Current Location",
      notifications: "Notifications",
      notificationsDesc: "Manage how you receive notifications",
      emailNotifications: "Email Notifications",
      emailNotificationsDesc: "Receive notifications via email",
      pushNotifications: "Push Notifications",
      pushNotificationsDesc: "Receive push notifications on your device",
      messageNotifications: "Message Notifications",
      messageNotificationsDesc: "Get notified when you receive messages",
      newListings: "New Listings in Categories",
      newListingsDesc: "Notify me about new items in my favorite categories",
      privacy: "Privacy & Security",
      privacyDesc: "Control your privacy and security settings",
      showPhone: "Show Phone Number",
      showPhoneDesc: "Display your phone number on your listings",
      showEmail: "Show Email Address",
      showEmailDesc: "Display your email on your listings",
      twoFactor: "Two-Factor Authentication",
      twoFactorDesc: "Add an extra layer of security",
      appearance: "Appearance",
      appearanceDesc: "Customize how TijarahJo looks",
      darkMode: "Dark Mode",
      darkModeDesc: "Switch to dark theme",
      languageSetting: "Language",
      languageDesc: "Choose your preferred language",
      help: "Help & Support",
      helpDesc: "Get help and support",
      helpCenter: "Help Center",
      contactSupport: "Contact Support",
      reportIssue: "Report an Issue",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      dangerZone: "Danger Zone",
      dangerDesc: "Irreversible actions",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "Permanently delete your account and all data",
      logout: "Logout",
      logoutDesc: "Sign out of your account",
      save: "Save Changes",
      cancel: "Cancel",
      update: "Update",
      enable: "Enable",
      disabled: "Disabled",
      enabled: "Enabled",
      editProfile: "Edit Profile",
    },
    ar: {
      settings: "الإعدادات",
      accountSettings: "إعدادات الحساب",
      accountDesc: "إدارة معلومات حسابك وتفضيلاتك",
      fullName: "الاسم الكامل",
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      currentLocation: "الموقع الحالي",
      notifications: "الإشعارات",
      notificationsDesc: "إدارة كيفية تلقي الإشعارات",
      emailNotifications: "إشعارات البريد الإلكتروني",
      emailNotificationsDesc: "تلقي الإشعارات عبر البريد الإلكتروني",
      pushNotifications: "الإشعارات الفورية",
      pushNotificationsDesc: "تلقي الإشعارات الفورية على جهازك",
      messageNotifications: "إشعارات الرسائل",
      messageNotificationsDesc: "احصل على إشعار عند تلقي الرسائل",
      newListings: "إعلانات جديدة في الفئات",
      newListingsDesc: "أخبرني عن العناصر الجديدة في فئاتي المفضلة",
      privacy: "الخصوصية والأمان",
      privacyDesc: "التحكم في إعدادات الخصوصية والأمان",
      showPhone: "إظهار رقم الهاتف",
      showPhoneDesc: "عرض رقم هاتفك في إعلاناتك",
      showEmail: "إظهار البريد الإلكتروني",
      showEmailDesc: "عرض بريدك الإلكتروني في إعلاناتك",
      twoFactor: "المصادقة الثنائية",
      twoFactorDesc: "أضف طبقة إضافية من الأمان",
      appearance: "المظهر",
      appearanceDesc: "تخصيص مظهر تجارة جو",
      darkMode: "الوضع الداكن",
      darkModeDesc: "التبديل إلى السمة الداكنة",
      languageSetting: "اللغة",
      languageDesc: "اختر لغتك المفضلة",
      help: "المساعدة والدعم",
      helpDesc: "احصل على المساعدة والدعم",
      helpCenter: "مركز المساعدة",
      contactSupport: "اتصل بالدعم",
      reportIssue: "الإبلاغ عن مشكلة",
      termsOfService: "شروط الخدمة",
      privacyPolicy: "سياسة الخصوصية",
      dangerZone: "منطقة الخطر",
      dangerDesc: "إجراءات لا رجعة فيها",
      deleteAccount: "حذف الحساب",
      deleteAccountDesc: "حذف حسابك وجميع بياناتك نهائياً",
      logout: "تسجيل الخروج",
      logoutDesc: "تسجيل الخروج من حسابك",
      save: "حفظ التغييرات",
      cancel: "إلغاء",
      update: "تحديث",
      enable: "تفعيل",
      disabled: "معطل",
      enabled: "مفعل",
      editProfile: "تعديل الملف الشخصي",
    },
  };

  const text = t[language as keyof typeof t] as typeof t.en;

  return (
    <div
      className="min-h-screen dark:bg-[#1a1a1a]"
      style={{ backgroundColor: "#F5F6FA" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm dark:bg-[#111111]"
        style={{ backgroundColor: "#0A4ABF" }}
      >
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#0A4ABF" + "20" }}
                  >
                    <User className="w-5 h-5" style={{ color: "#0A4ABF" }} />
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
                  style={{ color: "#0A4ABF", borderColor: "#0A4ABF" }}
                  onClick={onEditProfileClick}
                  className="hover:bg-blue-50 w-full sm:w-auto whitespace-nowrap"
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
                <Label className="text-sm opacity-60">
                  {text.currentLocation}
                </Label>
                <div className="flex items-center gap-2 dark:text-white">
                  <MapPin className="w-4 h-4 opacity-50" />
                  {displayLocation}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#FF6347" + "20" }}
                >
                  <Bell className="w-5 h-5" style={{ color: "#FF6347" }} />
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
                  <p className="text-sm text-gray-500">
                    {text.emailNotificationsDesc}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4" />
                    <Label>{text.pushNotifications}</Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    {text.pushNotificationsDesc}
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
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
                  checked={messageNotifications}
                  onCheckedChange={setMessageNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4" />
                    <Label>{text.newListings}</Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    {text.newListingsDesc}
                  </p>
                </div>
                <Switch
                  checked={newListingNotifications}
                  onCheckedChange={setNewListingNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#32CD32" + "20" }}
                >
                  <Lock className="w-5 h-5" style={{ color: "#32CD32" }} />
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
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
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
                  style={{ color: "#0A4ABF", borderColor: "#0A4ABF" }}
                >
                  {text.enable}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#FF69B4" + "20" }}
                >
                  <Moon className="w-5 h-5" style={{ color: "#FF69B4" }} />
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
                  style={{ color: "#0A4ABF", borderColor: "#0A4ABF" }}
                >
                  {language === "en" ? "العربية" : "English"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#8B4513" + "20" }}
                >
                  <HelpCircle
                    className="w-5 h-5"
                    style={{ color: "#8B4513" }}
                  />
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
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600"
              >
                {text.termsOfService}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600"
              >
                {text.privacyPolicy}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-600">
                    {text.dangerZone}
                  </CardTitle>
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
                      <Label className="text-red-600">
                        {text.deleteAccount}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      {text.deleteAccountDesc}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

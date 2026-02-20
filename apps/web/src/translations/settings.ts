import { Language } from "../types";

export type SettingsTranslations = {
  settings: string;
  accountSettings: string;
  accountDesc: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  notifications: string;
  notificationsDesc: string;
  emailNotifications: string;
  emailNotificationsDesc: string;
  pushNotifications: string;
  pushNotificationsDesc: string;
  messageNotifications: string;
  messageNotificationsDesc: string;
  newListings: string;
  newListingsDesc: string;
  privacy: string;
  privacyDesc: string;
  showPhone: string;
  showPhoneDesc: string;
  showEmail: string;
  showEmailDesc: string;
  twoFactor: string;
  twoFactorDesc: string;
  appearance: string;
  appearanceDesc: string;
  darkMode: string;
  darkModeDesc: string;
  languageSetting: string;
  languageDesc: string;
  help: string;
  helpDesc: string;
  helpCenter: string;
  contactSupport: string;
  reportIssue: string;
  termsOfService: string;
  privacyPolicy: string;
  dangerZone: string;
  dangerDesc: string;
  deleteAccount: string;
  deleteAccountDesc: string;
  logout: string;
  logoutDesc: string;
  save: string;
  cancel: string;
  update: string;
  enable: string;
  disabled: string;
  enabled: string;
  editProfile: string;
};

export const settingsTranslations: Record<Language, SettingsTranslations> = {
  en: {
    settings: "Settings",
    accountSettings: "Account Settings",
    accountDesc: "Manage your account information and preferences",
    fullName: "Full Name",
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

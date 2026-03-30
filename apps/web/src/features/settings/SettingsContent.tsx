import type { ReactNode } from "react";
import { Language } from "../../translations";
import { SettingsTranslations } from "../../translations/settings";
import { SettingsPreferences } from "./types";
import type { AppNotification } from "../../types";
import { AccountSection } from "./components/AccountSection";
import { NotificationsSettingsSection } from "./components/NotificationsSettingsSection";
import { PrivacySection } from "./components/PrivacySection";
import { AppearanceSection } from "./components/AppearanceSection";
import { HelpSection } from "./components/HelpSection";
import { DangerZoneSection } from "./components/DangerZoneSection";

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
}: SettingsContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AccountSection
        text={text}
        displayName={displayName}
        displayEmail={displayEmail}
        displayPhone={displayPhone}
        displayLocation={displayLocation}
        onEditProfileClick={onEditProfileClick}
      />

      <NotificationsSettingsSection
        text={text}
        language={language}
        settingsPreferences={settingsPreferences}
        updatePreference={updatePreference}
        onPushNotificationsChange={onPushNotificationsChange}
        isPushNotificationsDisabled={isPushNotificationsDisabled}
        notifications={notifications}
        isNotificationsLoading={isNotificationsLoading}
        isNotificationsMutationPending={isNotificationsMutationPending}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
      />

      <PrivacySection
        text={text}
        settingsPreferences={settingsPreferences}
        updatePreference={updatePreference}
        twoFactorDescription={twoFactorDescription}
        twoFactorControl={twoFactorControl}
      />

      <AppearanceSection
        text={text}
        language={language}
        darkMode={darkMode}
        onDarkModeChange={onDarkModeChange}
        onLanguageChange={onLanguageChange}
      />

      <HelpSection
        text={text}
        isRTL={isRTL}
        onOpenHelpCenter={onOpenHelpCenter}
        onContactSupport={onContactSupport}
        onReportIssue={onReportIssue}
        onOpenTerms={onOpenTerms}
        onOpenPrivacy={onOpenPrivacy}
      />

      <DangerZoneSection
        text={text}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
      />
    </div>
  );
}

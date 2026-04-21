import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Language } from "../../../translations";
import { settingsTranslations } from "../../../translations/settings";
import { STORAGE_KEYS } from "../../../constants";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import {
  defaultSettingsPreferences,
  SettingsPreferences,
} from "../types";
import { SettingsContent } from "../SettingsContent";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { InfoPageIntroCard } from "../../../shared/ui/info-page";
import { Button } from "../../../shared/ui/button";

import { useTwoFactorSettings } from "../useTwoFactorSettings";
import { TwoFactorDialog } from "../TwoFactorDialog";
import { DeleteAccountDialog } from "../DeleteAccountDialog";

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
  onDeleteAccount?: () => void | Promise<void>;
  userProfile: UserProfile;
  onEditProfileClick?: () => void;
  onOpenHelpCenter?: () => void;
  onContactSupport?: () => void;
  onReportIssue?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export function SettingsPage({
  onBackToMarketplace,
  language = "en",
  darkMode = false,
  onDarkModeChange,
  onLanguageChange,
  onLogout,
  onDeleteAccount,
  userProfile,
  onEditProfileClick,
  onOpenHelpCenter,
  onContactSupport,
  onReportIssue,
  onOpenTerms,
  onOpenPrivacy,
}: SettingsPageProps) {
  const isRTL = language === "ar";
  const [settingsPreferences, setSettingsPreferences] =
    useLocalStorage<SettingsPreferences>(
      STORAGE_KEYS.SETTINGS_PREFERENCES,
      defaultSettingsPreferences,
    );
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);
  const [isDeleteAccountPending, setIsDeleteAccountPending] = useState(false);

  const displayName = userProfile.name || "-";
  const displayEmail = userProfile.email || "-";
  const displayPhone = userProfile.phone || "-";
  const displayLocation = userProfile.location || "-";
  const text = settingsTranslations[language];
  const introDescription =
    language === "ar"
      ? "تحكم في إعدادات الحساب، الإشعارات، والخصوصية من لوحة واحدة."
      : "Manage account preferences, notifications, and privacy from one place.";

  const {
    copy: twoFactorCopy,
    twoFactorDescription,
    twoFactorActionLabel,
    isActionDisabled: isTwoFactorActionDisabled,
    isDialogOpen: isTwoFactorDialogOpen,
    dialogMode: twoFactorDialogMode,
    code: twoFactorCode,
    error: twoFactorError,
    isMutationPending: isTwoFactorMutationPending,
    onTwoFactorAction: handleTwoFactorAction,
    onConfirmDialog: handleConfirmTwoFactorDialog,
    onCodeChange: handleTwoFactorCodeChange,
    onDialogOpenChange: handleTwoFactorDialogOpenChange,
    onCancelDialog: handleCancelTwoFactorDialog,
  } = useTwoFactorSettings({
    language,
  });

  const updatePreference =
    (key: keyof SettingsPreferences) => (value: boolean) => {
      setSettingsPreferences((previous) => ({
        ...previous,
        [key]: value,
      }));
    };

  const handleConfirmDeleteAccount = async () => {
    if (!onDeleteAccount) {
      setIsDeleteAccountDialogOpen(false);
      return;
    }

    setIsDeleteAccountPending(true);
    try {
      await onDeleteAccount();
      setIsDeleteAccountDialogOpen(false);
    } finally {
      setIsDeleteAccountPending(false);
    }
  };
  const handleDeleteAccountDialogOpenChange = (open: boolean) => {
    if (isDeleteAccountPending) {
      return;
    }
    setIsDeleteAccountDialogOpen(open);
  };

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBackToMarketplace}
        isRTL={isRTL}
        backLabel={text.settings}
        showLogo={false}
        title={text.settings}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <InfoPageIntroCard
          icon={Settings2}
          title={text.settings}
          description={introDescription}
          className="mb-6"
        />

        <SettingsContent
          language={language}
          isRTL={isRTL}
          darkMode={darkMode}
          onDarkModeChange={onDarkModeChange}
          onLanguageChange={onLanguageChange}
          onLogout={onLogout}
          onEditProfileClick={onEditProfileClick}
          onOpenHelpCenter={onOpenHelpCenter}
          onContactSupport={onContactSupport}
          onReportIssue={onReportIssue}
          onOpenTerms={onOpenTerms}
          onOpenPrivacy={onOpenPrivacy}
          text={text}
          settingsPreferences={settingsPreferences}
          updatePreference={updatePreference}

          displayName={displayName}
          displayEmail={displayEmail}
          displayPhone={displayPhone}
          displayLocation={displayLocation}
          onDeleteAccount={
            onDeleteAccount
              ? () => setIsDeleteAccountDialogOpen(true)
              : undefined
          }
          twoFactorDescription={twoFactorDescription}
          twoFactorControl={
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary"
              disabled={isTwoFactorActionDisabled}
              onClick={handleTwoFactorAction}
            >
              {twoFactorActionLabel}
            </Button>
          }
        />

        <TwoFactorDialog
          language={language}
          open={isTwoFactorDialogOpen}
          onOpenChange={handleTwoFactorDialogOpenChange}
          mode={twoFactorDialogMode}
          copy={twoFactorCopy}
          code={twoFactorCode}
          error={twoFactorError}
          isPending={isTwoFactorMutationPending}
          onCodeChange={handleTwoFactorCodeChange}
          onCancel={handleCancelTwoFactorDialog}
          onConfirm={handleConfirmTwoFactorDialog}
        />

        <DeleteAccountDialog
          language={language}
          open={isDeleteAccountDialogOpen}
          pending={isDeleteAccountPending}
          cancelLabel={text.cancel}
          onOpenChange={handleDeleteAccountDialogOpenChange}
          onCancel={() => setIsDeleteAccountDialogOpen(false)}
          onConfirm={handleConfirmDeleteAccount}
        />
      </div>
    </PageShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { logger } from "../../shared/lib/logger";
import type { Language } from "../../translations";

export type TwoFactorDialogMode = "setup" | "disable";

export interface TwoFactorCopy {
  setupTitle: string;
  setupDescription: string;
  disableTitle: string;
  disableDescription: string;
  secretKeyLabel: string;
  otpUriLabel: string;
  codeLabel: string;
  codePlaceholder: string;
  cancel: string;
  confirmSetup: string;
  confirmDisable: string;
  enable: string;
  manage: string;
  enabledDescription: string;
  pendingDescription: string;
  defaultDescription: string;
  copySuccess: string;
  setupStarted: string;
  enabledSuccess: string;
  disabledSuccess: string;
  genericError: string;
  codeRequired: string;
}

interface UseTwoFactorSettingsParams {
  language: Language;
}

interface UseTwoFactorSettingsResult {
  copy: TwoFactorCopy;
  twoFactorDescription: string;
  twoFactorActionLabel: string;
  isActionDisabled: boolean;
  isDialogOpen: boolean;
  dialogMode: TwoFactorDialogMode;
  secretKey: string;
  otpAuthUri: string;
  code: string;
  error: string;
  isMutationPending: boolean;
  onTwoFactorAction: () => Promise<void>;
  onConfirmDialog: () => Promise<void>;
  onCodeChange: (value: string) => void;
  onCopyText: (value: string) => Promise<void>;
  onDialogOpenChange: (open: boolean) => void;
  onCancelDialog: () => void;
}

function getTwoFactorCopy(language: Language): TwoFactorCopy {
  if (language === "ar") {
    return {
      setupTitle: "تفعيل المصادقة الثنائية",
      setupDescription:
        "افتح تطبيق المصادقة، أضف الحساب بالمفتاح أدناه، ثم أدخل رمز التحقق.",
      disableTitle: "تعطيل المصادقة الثنائية",
      disableDescription:
        "أدخل رمزًا صالحًا من تطبيق المصادقة لتأكيد تعطيل المصادقة الثنائية.",
      secretKeyLabel: "المفتاح السري",
      otpUriLabel: "رابط QR (otpauth://)",
      codeLabel: "رمز التحقق",
      codePlaceholder: "123456",
      cancel: "إلغاء",
      confirmSetup: "تأكيد التفعيل",
      confirmDisable: "تأكيد التعطيل",
      enable: "تفعيل",
      manage: "إدارة",
      enabledDescription: "المصادقة الثنائية مفعلة على حسابك.",
      pendingDescription: "أكمل خطوة التأكيد لتفعيل المصادقة الثنائية.",
      defaultDescription: "أضف طبقة إضافية من الأمان باستخدام تطبيق المصادقة.",
      copySuccess: "تم النسخ.",
      setupStarted: "تم إنشاء إعداد المصادقة الثنائية.",
      enabledSuccess: "تم تفعيل المصادقة الثنائية.",
      disabledSuccess: "تم تعطيل المصادقة الثنائية.",
      genericError: "حدث خطأ أثناء تحديث إعدادات المصادقة الثنائية.",
      codeRequired: "أدخل رمز تحقق صحيحًا مكوّنًا من 6 أرقام.",
    };
  }

  return {
    setupTitle: "Enable Two-Factor Authentication",
    setupDescription:
      "Open your authenticator app, add the account using the key below, then enter the verification code.",
    disableTitle: "Disable Two-Factor Authentication",
    disableDescription:
      "Enter a valid authenticator code to confirm disabling two-factor authentication.",
    secretKeyLabel: "Secret Key",
    otpUriLabel: "QR URI (otpauth://)",
    codeLabel: "Verification Code",
    codePlaceholder: "123456",
    cancel: "Cancel",
    confirmSetup: "Confirm Enable",
    confirmDisable: "Confirm Disable",
    enable: "Enable",
    manage: "Manage",
    enabledDescription: "Two-factor authentication is enabled for your account.",
    pendingDescription: "Finish verification to complete two-factor activation.",
    defaultDescription: "Add an extra security layer using an authenticator app.",
    copySuccess: "Copied.",
    setupStarted: "Two-factor setup generated.",
    enabledSuccess: "Two-factor authentication enabled.",
    disabledSuccess: "Two-factor authentication disabled.",
    genericError: "Something went wrong while updating two-factor settings.",
    codeRequired: "Enter a valid 6-digit verification code.",
  };
}

export function useTwoFactorSettings({
  language,
}: UseTwoFactorSettingsParams): UseTwoFactorSettingsResult {
  const copy = useMemo(() => getTwoFactorCopy(language), [language]);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(true);
  const [isTwoFactorMutationPending, setIsTwoFactorMutationPending] = useState(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [hasPendingTwoFactorSetup, setHasPendingTwoFactorSetup] = useState(false);
  const [isTwoFactorDialogOpen, setIsTwoFactorDialogOpen] = useState(false);
  const [twoFactorDialogMode, setTwoFactorDialogMode] =
    useState<TwoFactorDialogMode>("setup");
  const [twoFactorSecretKey, setTwoFactorSecretKey] = useState("");
  const [twoFactorOtpAuthUri, setTwoFactorOtpAuthUri] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  const loadTwoFactorStatus = useCallback(async () => {
    setIsTwoFactorLoading(true);
    try {
      const response = await api.auth.getTwoFactorStatus();
      if (!response.success) {
        setIsTwoFactorEnabled(false);
        setHasPendingTwoFactorSetup(false);
        if (response.message) {
          logger.warn("[SettingsPage] Failed to load 2FA status:", response.message);
        }
        return;
      }

      setIsTwoFactorEnabled(response.enabled);
      setHasPendingTwoFactorSetup(response.hasPendingSetup);
    } catch (error) {
      logger.warn("[SettingsPage] Failed to load 2FA status", error);
      setIsTwoFactorEnabled(false);
      setHasPendingTwoFactorSetup(false);
    } finally {
      setIsTwoFactorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTwoFactorStatus();
  }, [loadTwoFactorStatus]);

  const resetTwoFactorDialogState = useCallback(() => {
    setTwoFactorCode("");
    setTwoFactorError("");
    setTwoFactorSecretKey("");
    setTwoFactorOtpAuthUri("");
  }, []);

  const onDialogOpenChange = useCallback((open: boolean) => {
    setIsTwoFactorDialogOpen(open);
    if (!open) {
      resetTwoFactorDialogState();
    }
  }, [resetTwoFactorDialogState]);

  const onCopyText = useCallback(async (value: string) => {
    if (!value.trim() || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value.trim());
      toast.success(copy.copySuccess);
    } catch (error) {
      logger.warn("[SettingsPage] Clipboard copy failed", error);
    }
  }, [copy.copySuccess]);

  const onTwoFactorAction = useCallback(async () => {
    if (isTwoFactorLoading || isTwoFactorMutationPending) {
      return;
    }

    if (isTwoFactorEnabled) {
      setTwoFactorDialogMode("disable");
      setTwoFactorCode("");
      setTwoFactorError("");
      setIsTwoFactorDialogOpen(true);
      return;
    }

    setIsTwoFactorMutationPending(true);
    setTwoFactorError("");
    try {
      const response = await api.auth.startTwoFactorSetup();
      if (!response.success || !response.secretKey || !response.otpAuthUri) {
        toast.error(response.message || copy.genericError);
        return;
      }

      setTwoFactorDialogMode("setup");
      setTwoFactorSecretKey(response.secretKey);
      setTwoFactorOtpAuthUri(response.otpAuthUri);
      setTwoFactorCode("");
      setIsTwoFactorDialogOpen(true);
      toast.success(response.message || copy.setupStarted);
      await loadTwoFactorStatus();
    } catch (error) {
      logger.warn("[SettingsPage] Failed to start 2FA setup", error);
      toast.error(copy.genericError);
    } finally {
      setIsTwoFactorMutationPending(false);
    }
  }, [
    copy.genericError,
    copy.setupStarted,
    isTwoFactorEnabled,
    isTwoFactorLoading,
    isTwoFactorMutationPending,
    loadTwoFactorStatus,
  ]);

  const onConfirmDialog = useCallback(async () => {
    if (isTwoFactorMutationPending) {
      return;
    }

    const normalizedTwoFactorCode = twoFactorCode.replace(/\D+/g, "");
    if (normalizedTwoFactorCode.length !== 6) {
      setTwoFactorError(copy.codeRequired);
      return;
    }

    setIsTwoFactorMutationPending(true);
    setTwoFactorError("");
    try {
      if (twoFactorDialogMode === "setup") {
        const response = await api.auth.confirmTwoFactorSetup(normalizedTwoFactorCode);
        if (!response.success) {
          setTwoFactorError(response.message || copy.genericError);
          return;
        }
        toast.success(response.message || copy.enabledSuccess);
      } else {
        const response = await api.auth.disableTwoFactor(normalizedTwoFactorCode);
        if (!response.success) {
          setTwoFactorError(response.message || copy.genericError);
          return;
        }
        toast.success(response.message || copy.disabledSuccess);
      }

      setIsTwoFactorDialogOpen(false);
      resetTwoFactorDialogState();
      await loadTwoFactorStatus();
    } catch (error) {
      logger.warn("[SettingsPage] Failed to confirm 2FA action", error);
      setTwoFactorError(copy.genericError);
    } finally {
      setIsTwoFactorMutationPending(false);
    }
  }, [
    copy.codeRequired,
    copy.disabledSuccess,
    copy.enabledSuccess,
    copy.genericError,
    isTwoFactorMutationPending,
    loadTwoFactorStatus,
    resetTwoFactorDialogState,
    twoFactorCode,
    twoFactorDialogMode,
  ]);

  const onCancelDialog = useCallback(() => {
    setIsTwoFactorDialogOpen(false);
    resetTwoFactorDialogState();
  }, [resetTwoFactorDialogState]);

  const twoFactorDescription = isTwoFactorEnabled
    ? copy.enabledDescription
    : hasPendingTwoFactorSetup
      ? copy.pendingDescription
      : copy.defaultDescription;

  return {
    copy,
    twoFactorDescription,
    twoFactorActionLabel:
      isTwoFactorEnabled || hasPendingTwoFactorSetup ? copy.manage : copy.enable,
    isActionDisabled: isTwoFactorLoading || isTwoFactorMutationPending,
    isDialogOpen: isTwoFactorDialogOpen,
    dialogMode: twoFactorDialogMode,
    secretKey: twoFactorSecretKey,
    otpAuthUri: twoFactorOtpAuthUri,
    code: twoFactorCode,
    error: twoFactorError,
    isMutationPending: isTwoFactorMutationPending,
    onTwoFactorAction,
    onConfirmDialog,
    onCodeChange: (value: string) => setTwoFactorCode(value.replace(/\D+/g, "")),
    onCopyText,
    onDialogOpenChange,
    onCancelDialog,
  };
}

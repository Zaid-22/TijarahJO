import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushNotificationStatus,
  type PushNotificationErrorCode,
} from "../../services/pushNotifications";
import { logger } from "../../shared/lib/logger";
import type { Language } from "../../translations";
import type { SettingsPreferences } from "./types";

interface UsePushNotificationsPreferenceParams {
  language: Language;
  setSettingsPreferences: Dispatch<SetStateAction<SettingsPreferences>>;
}

function getPushNotificationErrorMessage(
  code: PushNotificationErrorCode,
  language: Language,
): string {
  if (language === "ar") {
    switch (code) {
      case "UNSUPPORTED":
        return "المتصفح الحالي لا يدعم الإشعارات الفورية.";
      case "CONFIG_DISABLED":
        return "خدمة الإشعارات الفورية غير مفعلة حالياً.";
      case "PERMISSION_DENIED":
        return "تم رفض إذن الإشعارات من المتصفح.";
      case "REGISTRATION_FAILED":
        return "تعذر تفعيل الإشعارات الفورية على هذا الجهاز.";
      case "SUBSCRIPTION_INVALID":
        return "بيانات الاشتراك في الإشعارات غير صالحة.";
      case "SYNC_FAILED":
        return "تعذر مزامنة إعداد الإشعارات مع الخادم.";
      default:
        return "حدث خطأ أثناء تحديث إعدادات الإشعارات.";
    }
  }

  switch (code) {
    case "UNSUPPORTED":
      return "Push notifications are not supported in this browser.";
    case "CONFIG_DISABLED":
      return "Push notifications are currently disabled on the server.";
    case "PERMISSION_DENIED":
      return "Notification permission was denied by the browser.";
    case "REGISTRATION_FAILED":
      return "Could not enable push notifications on this device.";
    case "SUBSCRIPTION_INVALID":
      return "Push subscription payload is invalid.";
    case "SYNC_FAILED":
      return "Failed to sync push notification preference with the backend.";
    default:
      return "Something went wrong while updating notification settings.";
  }
}

export function usePushNotificationsPreference({
  language,
  setSettingsPreferences,
}: UsePushNotificationsPreferenceParams) {
  const [isPushStatusLoading, setIsPushStatusLoading] = useState(true);
  const [isPushUpdatePending, setIsPushUpdatePending] = useState(false);
  const [isPushToggleAvailable, setIsPushToggleAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pushStatus = await getPushNotificationStatus();
        if (cancelled) {
          return;
        }

        setIsPushToggleAvailable(pushStatus.supported && pushStatus.configEnabled);
        setSettingsPreferences((previous) => ({
          ...previous,
          pushNotifications: pushStatus.subscribed,
        }));
      } catch (error) {
        if (!cancelled) {
          logger.warn("[SettingsPage] Failed to load push notification status", error);
          setSettingsPreferences((previous) => ({
            ...previous,
            pushNotifications: false,
          }));
          setIsPushToggleAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setIsPushStatusLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSettingsPreferences]);

  const handlePushNotificationsToggle = useCallback(async (value: boolean) => {
    if (isPushStatusLoading || isPushUpdatePending || !isPushToggleAvailable) {
      return;
    }

    setIsPushUpdatePending(true);
    try {
      const result = value
        ? await enablePushNotifications()
        : await disablePushNotifications();

      if (!result.success) {
        toast.error(getPushNotificationErrorMessage(result.code, language));
        setSettingsPreferences((previous) => ({
          ...previous,
          pushNotifications: false,
        }));
        return;
      }

      setSettingsPreferences((previous) => ({
        ...previous,
        pushNotifications: value,
      }));
    } catch (error) {
      logger.warn("[SettingsPage] Failed to toggle push notifications", error);
      toast.error(getPushNotificationErrorMessage("UNKNOWN", language));
      setSettingsPreferences((previous) => ({
        ...previous,
        pushNotifications: false,
      }));
    } finally {
      setIsPushUpdatePending(false);
    }
  }, [
    isPushStatusLoading,
    isPushToggleAvailable,
    isPushUpdatePending,
    language,
    setSettingsPreferences,
  ]);

  return {
    isPushStatusLoading,
    isPushUpdatePending,
    isPushToggleAvailable,
    handlePushNotificationsToggle,
  };
}

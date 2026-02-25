import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../services/api";
import { logger } from "../../shared/lib/logger";
import type { AppNotification } from "../../types";
import type { Language } from "../../translations";

interface UseSettingsNotificationsParams {
  language: Language;
}

function getNotificationUpdateErrorMessage(language: Language) {
  return language === "ar"
    ? "تعذر تحديث حالة الإشعارات."
    : "Failed to update notifications state.";
}

function getSingleNotificationUpdateErrorMessage(language: Language) {
  return language === "ar"
    ? "تعذر تحديث حالة الإشعار."
    : "Failed to update notification state.";
}

export function useSettingsNotifications({
  language,
}: UseSettingsNotificationsParams) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [isNotificationsMutationPending, setIsNotificationsMutationPending] =
    useState(false);

  const loadNotificationsPreview = useCallback(async () => {
    setIsNotificationsLoading(true);
    try {
      const result = await api.notifications.getNotifications({
        take: 8,
      });
      setNotifications(result);
    } catch (error) {
      logger.warn("[SettingsPage] Failed to load notifications preview", error);
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotificationsPreview();
  }, [loadNotificationsPreview]);

  const handleMarkNotificationAsRead = useCallback(async (notificationId: number) => {
    if (isNotificationsMutationPending) {
      return;
    }

    setIsNotificationsMutationPending(true);
    try {
      const updated = await api.notifications.markAsRead(notificationId);
      if (!updated) {
        toast.error(getSingleNotificationUpdateErrorMessage(language));
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.notificationId === notificationId
            ? {
              ...notification,
              isRead: true,
            }
            : notification,
        ),
      );
    } catch (error) {
      logger.warn("[SettingsPage] Failed to mark notification as read", error);
      toast.error(getSingleNotificationUpdateErrorMessage(language));
    } finally {
      setIsNotificationsMutationPending(false);
    }
  }, [isNotificationsMutationPending, language]);

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    if (isNotificationsMutationPending) {
      return;
    }

    setIsNotificationsMutationPending(true);
    try {
      const unreadBeforeUpdate = notifications.filter(
        (notification) => !notification.isRead,
      ).length;
      const updatedCount = await api.notifications.markAllAsRead();
      if (updatedCount === 0 && unreadBeforeUpdate > 0) {
        await loadNotificationsPreview();
        toast.error(getNotificationUpdateErrorMessage(language));
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      logger.warn("[SettingsPage] Failed to mark all notifications as read", error);
      toast.error(getNotificationUpdateErrorMessage(language));
    } finally {
      setIsNotificationsMutationPending(false);
    }
  }, [isNotificationsMutationPending, language, loadNotificationsPreview, notifications]);

  return {
    notifications,
    isNotificationsLoading,
    isNotificationsMutationPending,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
  };
}

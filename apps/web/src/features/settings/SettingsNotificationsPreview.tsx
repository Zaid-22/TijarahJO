import { Button } from "../../shared/ui/button";
import { Label } from "../../shared/ui/label";
import type { Language } from "../../translations";
import type { AppNotification } from "../../types";

interface SettingsNotificationsPreviewProps {
  language: Language;
  notifications: AppNotification[];
  isLoading: boolean;
  isMutationPending: boolean;
  onMarkNotificationAsRead?: (notificationId: number) => void;
  onMarkAllNotificationsAsRead?: () => void;
}

export function SettingsNotificationsPreview({
  language,
  notifications,
  isLoading,
  isMutationPending,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}: SettingsNotificationsPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{language === "ar" ? "آخر الإشعارات" : "Recent Notifications"}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMarkAllNotificationsAsRead}
          disabled={isMutationPending || notifications.length === 0}
        >
          {language === "ar" ? "تحديد الكل كمقروء" : "Mark All Read"}
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {language === "ar" ? "جارٍ تحميل الإشعارات..." : "Loading notifications..."}
        </p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {language === "ar" ? "لا توجد إشعارات حالياً." : "No notifications yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, 4).map((notification) => (
            <div
              key={notification.notificationId}
              className={`rounded-lg border p-3 ${
                notification.isRead
                  ? "bg-card"
                  : "border-primary/30 bg-primary/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground break-words">
                    {notification.body}
                  </p>
                </div>
                {!notification.isRead ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkNotificationAsRead?.(notification.notificationId)}
                    disabled={isMutationPending}
                  >
                    {language === "ar" ? "تمت القراءة" : "Mark Read"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

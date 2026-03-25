import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu";
import { api } from "../../../../services/api";
import type { AppNotification, Language } from "../../../../types";
import { logger } from "../../../../shared/lib/logger";

interface HeaderNotificationsDropdownProps {
  language: Language;
  unreadCount: number;
  onNavigate?: (url: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

function getNotificationIcon(type: string) {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("message") || normalizedType.includes("chat")) {
    return MessageCircle;
  }
  if (normalizedType.includes("favorite") || normalizedType.includes("like")) {
    return Heart;
  }
  if (normalizedType.includes("post") || normalizedType.includes("listing")) {
    return ShoppingBag;
  }
  return Bell;
}

function timeAgo(dateString: string, language: Language): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (language === "ar") {
    if (diffMinutes < 1) return "الآن";
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  }

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function HeaderNotificationsDropdown({
  language,
  unreadCount,
  onNavigate,
  onUnreadCountChange,
}: HeaderNotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.notifications.getNotifications({ take: 20 });
      setNotifications(data);
    } catch (error) {
      logger.warn("[NotificationsDropdown] Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    await api.notifications.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n,
      ),
    );
    const newCount = Math.max(0, unreadCount - 1);
    onUnreadCountChange?.(newCount);
    window.dispatchEvent(new Event("tijarahjo:refreshUnreadCount"));
  };

  const handleMarkAllAsRead = async () => {
    await api.notifications.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange?.(0);
    window.dispatchEvent(new Event("tijarahjo:refreshUnreadCount"));
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      void handleMarkAsRead(notification.notificationId);
    }
    if (notification.routeUrl && onNavigate) {
      onNavigate(notification.routeUrl);
      setIsOpen(false);
    }
  };

  const normalizedUnread = Math.max(0, Math.floor(unreadCount));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group relative h-10 w-10 rounded-full border border-border/60 bg-background/70 p-0 text-muted-foreground shadow-sm hover:border-primary/35 hover:bg-primary/5 hover:text-primary hover:shadow-md transition-all"
          aria-label={language === "ar" ? "الإشعارات" : "Notifications"}
        >
          <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
          {normalizedUnread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-destructive-foreground animate-in zoom-in duration-300 ring-2 ring-background">
              {normalizedUnread > 99 ? "99+" : normalizedUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-0 max-h-96 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground text-sm">
            {language === "ar" ? "الإشعارات" : "Notifications"}
          </h3>
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={() => void handleMarkAllAsRead()}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {language === "ar" ? "قراءة الكل" : "Mark all read"}
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {language === "ar" ? "لا توجد إشعارات" : "No notifications yet"}
              </p>
              <p className="text-xs mt-1">
                {language === "ar"
                  ? "ستظهر إشعاراتك هنا"
                  : "Your notifications will appear here"}
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.notificationType);
              return (
                <button
                  key={notification.notificationId}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors flex gap-3 items-start ${
                    !notification.isRead
                      ? "bg-primary/5 dark:bg-primary/10"
                      : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${
                      !notification.isRead
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${!notification.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {timeAgo(notification.createdAt, language)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* View All link */}
        <div className="border-t border-border bg-muted/30 px-4 py-2.5">
          <button
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate("/notifications");
              }
              setIsOpen(false);
            }}
            className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {language === "ar"
              ? "عرض جميع الإشعارات"
              : "View All Notifications"}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState, useEffect } from "react";
import { Bell, X, Flag, AlertTriangle, Clock } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";

type AdminNotification = {
  id: string;
  type: "report" | "flagged" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

const ICON_MAP = {
  report: Flag,
  flagged: AlertTriangle,
  system: Clock,
};

const COLOR_MAP = {
  report: "text-red-500",
  flagged: "text-amber-500",
  system: "text-blue-500",
};

export function AdminNotificationsBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch pending counts on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const stats = await api.admin.getStats();
        const items: AdminNotification[] = [];

        // Reports-based notifications
        if (stats.totalReviews > 0) {
          items.push({
            id: "pending-reviews",
            type: "system",
            title: "Reviews to moderate",
            message: `${stats.totalReviews} reviews in the system`,
            timestamp: new Date(),
            read: false,
          });
        }

        if (stats.blockedListings > 0) {
          items.push({
            id: "blocked-listings",
            type: "flagged",
            title: "Blocked listings",
            message: `${stats.blockedListings} listings currently blocked`,
            timestamp: new Date(),
            read: false,
          });
        }

        if (stats.newUsersThisWeek > 0) {
          items.push({
            id: "new-users",
            type: "system",
            title: "New registrations",
            message: `${stats.newUsersThisWeek} new users this week`,
            timestamp: new Date(),
            read: false,
          });
        }

        setNotifications(items);
      } catch (error) {
        logger.warn("[AdminNotificationsBell] fetch failed", error);
      }
    };
    void fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const dismissAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={dismissAll}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                        n.read ? "opacity-60" : "bg-muted/30"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COLOR_MAP[n.type]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => dismissNotification(n.id)}
                          className="p-0.5 rounded hover:bg-muted flex-shrink-0"
                          aria-label="Dismiss"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

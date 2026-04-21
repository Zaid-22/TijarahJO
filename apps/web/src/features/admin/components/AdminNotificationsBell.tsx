import { useState, useEffect, useCallback } from "react";
import { Bell, Flag, AlertTriangle, Clock } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
import { useAuth } from "../../../contexts/AuthContext";

type AdminNotification = {
  id: string;
  type: "report" | "flagged" | "system";
  title: string;
  message: string;
  count: number;
  timestamp: Date;
  read: boolean;
};

const ADMIN_NOTIFICATION_READ_STATE_KEY = "admin-notifications-read-state";
const ADMIN_NOTIFICATION_REFRESH_MS = 60_000;

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

function getReadStateKey(adminUserId: string | undefined): string {
  return `${ADMIN_NOTIFICATION_READ_STATE_KEY}:${adminUserId || "anonymous"}`;
}

function loadReadState(storageKey: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

function saveReadState(storageKey: string, nextState: Record<string, number>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextState));
  } catch {
    // Ignore storage failures; the notification UI can still work in-memory.
  }
}

function isCountRead(readState: Record<string, number>, id: string, count: number) {
  return (readState[id] ?? 0) >= count;
}

export function AdminNotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const readStateKey = getReadStateKey(user?.id);

  const fetchNotifications = useCallback(async () => {
    try {
      const stats = await api.admin.getStats();
      const readState = loadReadState(readStateKey);
      const items: AdminNotification[] = [];

      // Reports-based notifications
      if (stats.totalReviews > 0) {
        const count = stats.totalReviews;
        items.push({
          id: "pending-reviews",
          type: "system",
          title: "Reviews to moderate",
          message: `${count} reviews in the system`,
          count,
          timestamp: new Date(),
          read: isCountRead(readState, "pending-reviews", count),
        });
      }

      if (stats.blockedListings > 0) {
        const count = stats.blockedListings;
        items.push({
          id: "blocked-listings",
          type: "flagged",
          title: "Blocked listings",
          message: `${count} listings currently blocked`,
          count,
          timestamp: new Date(),
          read: isCountRead(readState, "blocked-listings", count),
        });
      }

      if (stats.newUsersThisWeek > 0) {
        const count = stats.newUsersThisWeek;
        items.push({
          id: "new-users",
          type: "system",
          title: "New registrations",
          message: `${count} new users this week`,
          count,
          timestamp: new Date(),
          read: isCountRead(readState, "new-users", count),
        });
      }

      setNotifications(items);
    } catch (error) {
      logger.warn("[AdminNotificationsBell] fetch failed", error);
    }
  }, [readStateKey]);

  useEffect(() => {
    void fetchNotifications();
    const intervalId = window.setInterval(
      fetchNotifications,
      ADMIN_NOTIFICATION_REFRESH_MS,
    );

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [fetchNotifications, isOpen]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadCountLabel = unreadCount > 99 ? "99+" : String(unreadCount);


  const dismissAll = () => {
    setNotifications((prev) => {
      const nextReadState = { ...loadReadState(readStateKey) };
      prev.forEach((notification) => {
        nextReadState[notification.id] = notification.count;
      });
      saveReadState(readStateKey, nextReadState);

      return prev.map((n) => ({ ...n, read: true }));
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative h-10 w-10 p-0"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-white">
            {unreadCountLabel}
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
                  Clear all
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.filter(n => !n.read).map((n) => {
                  const Icon = ICON_MAP[n.type];
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors bg-muted/30"
                    >
                      <Icon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${COLOR_MAP[n.type]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      </div>

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

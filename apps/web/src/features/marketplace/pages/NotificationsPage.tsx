import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Heart,
  ShoppingBag,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { InfoPageIntroCard } from "../../../shared/ui/info-page";
import { api } from "../../../services/api";
import type { AppNotification, Language } from "../../../types";

interface NotificationsPageProps {
  language: Language;
  onBack: () => void;
  onNavigate?: (path: string) => void;
}

type FilterTab = "all" | "messages" | "listings" | "system";

const COPY = {
  en: {
    title: "Notifications",
    description: "Stay up to date with your latest activity",
    all: "All",
    messages: "Messages",
    listings: "Listings",
    system: "System",
    markAllRead: "Mark all as read",
    noNotifications: "No notifications",
    noNotificationsDesc: "You're all caught up! Check back later.",
    loading: "Loading notifications...",
    error: "Failed to load notifications",
    retry: "Retry",
    justNow: "Just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  ar: {
    title: "الإشعارات",
    description: "ابقَ على اطلاع بآخر نشاطاتك",
    all: "الكل",
    messages: "الرسائل",
    listings: "الإعلانات",
    system: "النظام",
    markAllRead: "تحديد الكل كمقروء",
    noNotifications: "لا توجد إشعارات",
    noNotificationsDesc: "أنت على اطلاع! تحقق لاحقاً.",
    loading: "جاري تحميل الإشعارات...",
    error: "فشل تحميل الإشعارات",
    retry: "إعادة المحاولة",
    justNow: "الآن",
    minutesAgo: (n: number) => `منذ ${n} دقيقة`,
    hoursAgo: (n: number) => `منذ ${n} ساعة`,
    daysAgo: (n: number) => `منذ ${n} يوم`,
  },
};

function formatTimeAgo(dateStr: string, lang: Language): string {
  const copy = COPY[lang];
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return copy.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return copy.hoursAgo(hours);
  const days = Math.floor(hours / 24);
  return copy.daysAgo(days);
}

function getNotificationType(
  notificationType: string,
): "message" | "listing" | "system" {
  const t = notificationType.toLowerCase();
  if (t.includes("message") || t.includes("chat")) return "message";
  if (t.includes("post") || t.includes("listing") || t.includes("favorite"))
    return "listing";
  return "system";
}

function getNotificationIcon(notificationType: string) {
  const type = getNotificationType(notificationType);
  switch (type) {
    case "message":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "listing":
      return notificationType.toLowerCase().includes("favorite") ? (
        <Heart className="h-5 w-5 text-red-500" />
      ) : (
        <ShoppingBag className="h-5 w-5 text-green-500" />
      );
    case "system":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

export function NotificationsPage({
  language,
  onBack,
  onNavigate,
}: NotificationsPageProps) {
  const isRTL = language === "ar";
  const copy = COPY[language];
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.notifications.getNotifications();
      setNotifications(data);
    } catch {
      setError(copy.error);
    } finally {
      setIsLoading(false);
    }
  }, [copy.error]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    }
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    const type = getNotificationType(n.notificationType);
    if (activeTab === "messages") return type === "message";
    if (activeTab === "listings") return type === "listing";
    return type === "system";
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: copy.all },
    { key: "messages", label: copy.messages },
    { key: "listings", label: copy.listings },
    { key: "system", label: copy.system },
  ];

  return (
    <PageShell>
      <SubpageHeader
        onBack={onBack}
        isRTL={isRTL}
        backLabel={language === "ar" ? "العودة" : "Back"}
        showLogo={false}
        title={copy.title}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <InfoPageIntroCard
          icon={Bell}
          title={copy.title}
          description={copy.description}
          className="mb-6"
        />

        {/* Tab Filters + Mark All */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {copy.markAllRead}
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>{copy.loading}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchNotifications}>
              {copy.retry}
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Bell className="h-12 w-12 opacity-30" />
            <p className="font-medium text-lg">{copy.noNotifications}</p>
            <p className="text-sm">{copy.noNotificationsDesc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <button
                type="button"
                key={notification.notificationId}
                onClick={() => {
                  if (!notification.isRead)
                    markAsRead(notification.notificationId);
                  if (notification.routeUrl && onNavigate) {
                    onNavigate(notification.routeUrl);
                  }
                }}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                  isRTL ? "text-right" : ""
                } ${
                  notification.isRead
                    ? "bg-card border-border"
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.notificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm truncate ${
                          notification.isRead
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimeAgo(notification.createdAt, language)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.notificationId);
                      }}
                      className="mt-0.5 flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
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
import { formatRelativeTime } from "../../../shared/lib/dateTime";
import type { AppNotification, Language } from "../../../types";
import { formatChatPreviewText } from "../../chat/chatMessageContent";
import { useAuth } from "../../../contexts/AuthContext";

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
    markRead: "Mark as read",
    filterLabel: "Filter notifications",
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
    markRead: "تحديد كمقروء",
    filterLabel: "تصفية الإشعارات",
  },
};

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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isRTL = language === "ar";
  const copy = COPY[language];
  const dateTimeLocale = language === "ar" ? "ar-JO" : "en-US";
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loadedOwnerId, setLoadedOwnerId] = useState("");
  const requestRunIdRef = useRef(0);
  const ownerId = isAuthenticated ? String(user?.id || "").trim() : "";
  const currentOwnerIdRef = useRef(ownerId);
  currentOwnerIdRef.current = ownerId;

  const fetchNotifications = useCallback(async () => {
    const requestedOwnerId = ownerId;
    const runId = ++requestRunIdRef.current;
    const isCurrentRequest = () =>
      runId === requestRunIdRef.current &&
      currentOwnerIdRef.current === requestedOwnerId;

    setNotifications([]);
    setLoadedOwnerId("");
    setIsLoading(true);
    setError(null);
    if (!requestedOwnerId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.notifications.getNotifications();
      if (!isCurrentRequest()) {
        return;
      }
      setNotifications(data);
      setLoadedOwnerId(requestedOwnerId);
    } catch {
      if (isCurrentRequest()) {
        setError(copy.error);
        setLoadedOwnerId(requestedOwnerId);
      }
    } finally {
      if (isCurrentRequest()) {
        setIsLoading(false);
      }
    }
  }, [copy.error, ownerId]);

  useEffect(() => {
    void fetchNotifications();
    return () => {
      requestRunIdRef.current += 1;
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      onNavigate?.("/login");
    }
  }, [authLoading, isAuthenticated, onNavigate]);

  const markAsRead = useCallback(async (notificationId: number) => {
    const requestedOwnerId = currentOwnerIdRef.current;
    try {
      const success = await api.notifications.markAsRead(notificationId);
      if (!success || currentOwnerIdRef.current !== requestedOwnerId) {
        return;
      }
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
    const requestedOwnerId = currentOwnerIdRef.current;
    try {
      await api.notifications.markAllAsRead();
      if (currentOwnerIdRef.current !== requestedOwnerId) {
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silently fail
    }
  }, []);
  const dataBelongsToCurrentOwner = loadedOwnerId === ownerId;
  const scopedNotifications = dataBelongsToCurrentOwner ? notifications : [];
  const showLoading =
    authLoading ||
    (!isAuthenticated && Boolean(onNavigate)) ||
    isLoading ||
    !dataBelongsToCurrentOwner;
  const unreadCount = scopedNotifications.filter((n) => !n.isRead).length;
  const filteredNotifications = scopedNotifications.filter((n) => {
    if (activeTab === "all") return true;
    const type = getNotificationType(n.notificationType);
    if (activeTab === "messages") return type === "message";
    if (activeTab === "listings") return type === "listing";
    return type === "system";
  });



  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: copy.all },
    { key: "messages", label: copy.messages },
    { key: "listings", label: copy.listings },
    { key: "system", label: copy.system },
  ];

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tabIndex: number,
  ) => {
    let nextIndex = tabIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (tabIndex + (isRTL ? -1 : 1) + tabs.length) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (tabIndex + (isRTL ? 1 : -1) + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.key);
    document.getElementById(`notifications-tab-${nextTab.key}`)?.focus();
  };

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
          <div
            className="flex gap-1 bg-muted rounded-xl p-1"
            role="tablist"
            aria-label={copy.filterLabel}
          >
            {tabs.map((tab, tabIndex) => (
              <button
                key={tab.key}
                id={`notifications-tab-${tab.key}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, tabIndex)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="notifications-tabpanel"
                tabIndex={activeTab === tab.key ? 0 : -1}
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
        <div
          id="notifications-tabpanel"
          role="tabpanel"
          aria-labelledby={`notifications-tab-${activeTab}`}
        >
          {showLoading ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              <p>{copy.loading}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3" role="alert">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchNotifications}>
                {copy.retry}
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Bell className="h-12 w-12 opacity-30" aria-hidden="true" />
              <p className="font-medium text-lg">{copy.noNotifications}</p>
              <p className="text-sm">{copy.noNotificationsDesc}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`relative overflow-hidden rounded-xl border transition-all hover:shadow-sm ${
                    notification.isRead
                      ? "bg-card border-border"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <button
                    type="button"
                    aria-label={notification.title}
                    onClick={() => {
                      if (!notification.isRead) {
                        void markAsRead(notification.notificationId);
                      }
                      if (notification.routeUrl && onNavigate) {
                        onNavigate(notification.routeUrl);
                      }
                    }}
                    className="w-full p-4 pe-14 text-start transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0" aria-hidden="true">
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
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatRelativeTime(
                              notification.createdAt,
                              dateTimeLocale,
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {formatChatPreviewText(notification.body, language)}
                        </p>
                      </div>
                    </div>
                  </button>
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => {
                        void markAsRead(notification.notificationId);
                      }}
                      className="absolute end-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`${copy.markRead}: ${notification.title}`}
                    >
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

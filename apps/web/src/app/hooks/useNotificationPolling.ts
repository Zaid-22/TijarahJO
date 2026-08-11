import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { logger } from "../../shared/lib/logger";
import { deferredToast } from "../../utils/toast";
import { toPositiveIntegerId } from "../../utils/idValidation";

const UNREAD_COUNT_REFRESH_MS = 30_000;
const NOTIFICATION_SERVICE_RETRY_MS = 60_000;

type UseNotificationPollingOptions = {
  suspended?: boolean;
};

/**
 * Manages unread notification count via polling, SignalR realtime updates,
 * and chat-route refresh. Returns the current count.
 * Uses dynamic import for chatService to defer SignalR loading.
 */
export function useNotificationPolling(
  options: UseNotificationPollingOptions = {},
) {
  const { suspended = false } = options;
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadedOwnerId, setLoadedOwnerId] = useState("");
  const [notificationsRetryAt, setNotificationsRetryAt] = useState<number | null>(null);
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);
  const ownerId = isAuthenticated ? String(user?.id || "").trim() : "";

  const normalizedPathname = location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");
  const isChatRoute =
    normalizedPathname === "/chat" || normalizedPathname.startsWith("/chat/");
  const isNotificationsServiceCoolingDown =
    notificationsRetryAt !== null && notificationsRetryAt > Date.now();

  useEffect(() => {
    if (notificationsRetryAt === null) {
      return;
    }

    const remainingMs = notificationsRetryAt - Date.now();
    if (remainingMs <= 0) {
      setNotificationsRetryAt(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationsRetryAt(null);
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notificationsRetryAt]);

  // Polling
  useEffect(() => {
    if (!isAuthenticated || suspended) {
      setUnreadNotificationsCount(0);
      setLoadedOwnerId("");
      return;
    }

    if (isNotificationsServiceCoolingDown) {
      return;
    }

    let isCancelled = false;
    setUnreadNotificationsCount(0);
    setLoadedOwnerId("");
    const refreshUnreadCount = async () => {
      try {
        const result = await api.notifications.getUnreadCountResult(ownerId);
        if (!isCancelled) {
          if (result.serviceUnavailable) {
            setNotificationsRetryAt(Date.now() + NOTIFICATION_SERVICE_RETRY_MS);
            return;
          }

          setNotificationsRetryAt(null);
          setUnreadNotificationsCount(result.unreadCount);
          setLoadedOwnerId(ownerId);
        }
      } catch (error) {
        logger.warn("[App] Failed to load unread notifications count:", error);
      }
    };

    void refreshUnreadCount();
    const intervalId = window.setInterval(
      refreshUnreadCount,
      UNREAD_COUNT_REFRESH_MS,
    );

    window.addEventListener("tijarahjo:refreshUnreadCount", refreshUnreadCount);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("tijarahjo:refreshUnreadCount", refreshUnreadCount);
    };
  }, [isAuthenticated, ownerId, suspended, isNotificationsServiceCoolingDown]);

  // Realtime notifications via SignalR (dynamically loaded)
  useEffect(() => {
    if (!isAuthenticated || suspended) {
      subscriptionCleanupRef.current?.();
      subscriptionCleanupRef.current = null;
      return;
    }

    let isDisposed = false;

    import("../../services/chatService").then((mod) => {
      if (isDisposed) {
        return;
      }

      subscriptionCleanupRef.current?.();
      subscriptionCleanupRef.current = mod.chatService.onNotificationReceived((notification) => {
        const routeConversationId = toPositiveIntegerId(
          new URLSearchParams(location.search).get("conversationId"),
        );
        const inChatWithSender =
          isChatRoute &&
          typeof notification.senderUserId === "number" &&
          normalizedPathname.endsWith(`/${notification.senderUserId}`);
        const inSameConversation =
          !notification.conversationId ||
          !routeConversationId ||
          notification.conversationId === routeConversationId;

        if (!inChatWithSender || !inSameConversation) {
          deferredToast.info(`${notification.title}: ${notification.body}`);
        }

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState !== "visible"
        ) {
          const nativeNotification = new Notification(notification.title, {
            body: notification.body,
            tag: `notif-${notification.notificationId}`,
          });
          nativeNotification.onclick = () => {
            window.focus();
            navigate(notification.routeUrl || "/chat");
            nativeNotification.close();
          };
        }

        void api.notifications
          .getUnreadCountResult(ownerId)
          .then((result) => {
            if (isDisposed) {
              return;
            }
            if (result.serviceUnavailable) {
              setNotificationsRetryAt(Date.now() + NOTIFICATION_SERVICE_RETRY_MS);
              return;
            }

            setNotificationsRetryAt(null);
            setUnreadNotificationsCount(result.unreadCount);
            setLoadedOwnerId(ownerId);
          })
          .catch((error) => {
            logger.warn(
              "[App] Failed to refresh unread count after realtime notification:",
              error,
            );
          });
      });
    });

    return () => {
      isDisposed = true;
      subscriptionCleanupRef.current?.();
      subscriptionCleanupRef.current = null;
    };
  }, [
    isAuthenticated,
    isChatRoute,
    location.search,
    navigate,
    normalizedPathname,
    ownerId,
    suspended,
    isNotificationsServiceCoolingDown,
  ]);

  // Refresh on chat route entry
  useEffect(() => {
    if (
      !isAuthenticated ||
      suspended ||
      isNotificationsServiceCoolingDown ||
      !isChatRoute
    ) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      void api.notifications
        .getUnreadCountResult(ownerId)
        .then((result) => {
          if (isCancelled) {
            return;
          }
          if (result.serviceUnavailable) {
            setNotificationsRetryAt(Date.now() + NOTIFICATION_SERVICE_RETRY_MS);
            return;
          }

          setNotificationsRetryAt(null);
          setUnreadNotificationsCount(result.unreadCount);
          setLoadedOwnerId(ownerId);
        })
        .catch((error) => {
          logger.warn(
            "[App] Failed to refresh unread count on chat route:",
            error,
          );
        });
    }, 1200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isChatRoute, location.pathname, ownerId, suspended, isNotificationsServiceCoolingDown]);

  return {
    unreadNotificationsCount:
      loadedOwnerId === ownerId ? unreadNotificationsCount : 0,
  };
}

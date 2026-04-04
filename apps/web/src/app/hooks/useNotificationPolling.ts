import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { logger } from "../../shared/lib/logger";
import { deferredToast } from "../../utils/toast";
import { toPositiveIntegerId } from "../../utils/idValidation";

const UNREAD_COUNT_REFRESH_MS = 30_000;

/**
 * Manages unread notification count via polling, SignalR realtime updates,
 * and chat-route refresh. Returns the current count.
 * Uses dynamic import for chatService to defer SignalR loading.
 */
export function useNotificationPolling() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);

  const normalizedPathname = location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");
  const isChatRoute =
    normalizedPathname === "/chat" || normalizedPathname.startsWith("/chat/");

  // Polling
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      return;
    }

    let isCancelled = false;
    const refreshUnreadCount = async () => {
      try {
        const unreadCount = await api.notifications.getUnreadCount();
        if (!isCancelled) {
          setUnreadNotificationsCount(unreadCount);
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
  }, [isAuthenticated]);

  // Realtime notifications via SignalR (dynamically loaded)
  useEffect(() => {
    if (!isAuthenticated) {
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
          .getUnreadCount()
          .then((count) => {
            setUnreadNotificationsCount(count);
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
  ]);

  // Refresh on chat route entry
  useEffect(() => {
    if (!isAuthenticated || !isChatRoute) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void api.notifications
        .getUnreadCount()
        .then((count) => {
          setUnreadNotificationsCount(count);
        })
        .catch((error) => {
          logger.warn(
            "[App] Failed to refresh unread count on chat route:",
            error,
          );
        });
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isChatRoute, location.pathname]);

  return { unreadNotificationsCount };
}

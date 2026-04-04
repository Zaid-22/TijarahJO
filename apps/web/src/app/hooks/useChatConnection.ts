import { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logger } from "../../shared/lib/logger";
import { toPositiveIntegerId } from "../../utils/idValidation";

/**
 * Connects / disconnects the SignalR chat hub based on auth state.
 * Uses dynamic import to defer loading @microsoft/signalr (~105 KiB)
 * until a user is actually authenticated.
 */
export function useChatConnection() {
  const { isAuthenticated, user } = useAuth();
  const serviceRef = useRef<typeof import("../../services/chatService") | null>(null);

  useEffect(() => {
    let isDisposed = false;

    if (!isAuthenticated) {
      // Disconnect if we already loaded the service
      if (serviceRef.current) {
        serviceRef.current.chatService.disconnect().catch((error) => {
          logger.warn("[App] SignalR disconnect failed:", error);
        });
      }
      return;
    }

    const currentUserId = toPositiveIntegerId(user?.id);
    if (!currentUserId) {
      return;
    }

    // Dynamically import chatService (and SignalR) only when authenticated
    import("../../services/chatService").then((mod) => {
      if (isDisposed) {
        return;
      }

      serviceRef.current = mod;
      mod.chatService.connect(currentUserId).catch((error) => {
        logger.warn("[App] SignalR connect failed:", error);
      });
    });

    return () => {
      isDisposed = true;
    };
  }, [isAuthenticated, user?.id]);
}

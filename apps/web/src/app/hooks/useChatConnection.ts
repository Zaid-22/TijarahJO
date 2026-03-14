import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import { logger } from "../../shared/lib/logger";
import { toPositiveIntegerId } from "../../utils/idValidation";

/**
 * Connects / disconnects the SignalR chat hub based on auth state.
 */
export function useChatConnection() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      chatService.disconnect().catch((error) => {
        logger.warn("[App] SignalR disconnect failed:", error);
      });
      return;
    }

    const currentUserId = toPositiveIntegerId(user?.id);
    if (!currentUserId) {
      return;
    }

    chatService.connect(currentUserId).catch((error) => {
      logger.warn("[App] SignalR connect failed:", error);
    });
  }, [isAuthenticated, user?.id]);
}

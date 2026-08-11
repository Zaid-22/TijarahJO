import { MutableRefObject, useEffect } from "react";
import { OFFLINE_SESSION_MESSAGE } from "./authRuntimePolicy";
import { canRevalidateSession } from "./authRuntimePolicy";
import {
  AUTH_ADMIN_ACCESS_HINT_KEY,
  AUTH_GUEST_KEY,
  AUTH_LEGACY_KEYS,
  AUTH_LOGOUT_KEY,
  AUTH_SESSION_HINT_KEY,
  debugAuthLog,
} from "./authContextUtils";

interface UseAuthEventSyncParams {
  checkAuth: () => Promise<void>;
  emitAuthError: (message: string) => void;
  consecutiveNetworkFailuresRef: MutableRefObject<number>;
  lastRevalidateAtRef: MutableRefObject<number>;
}

export function useAuthEventSync({
  checkAuth,
  emitAuthError,
  consecutiveNetworkFailuresRef,
  lastRevalidateAtRef,
}: UseAuthEventSyncParams) {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === AUTH_GUEST_KEY ||
        e.key === AUTH_LOGOUT_KEY ||
        e.key === AUTH_SESSION_HINT_KEY ||
        e.key === AUTH_ADMIN_ACCESS_HINT_KEY ||
        e.key === null ||
        (typeof e.key === "string" && AUTH_LEGACY_KEYS.includes(e.key))
      ) {
        debugAuthLog(
          "[AuthContext] Auth storage changed, refreshing auth state",
        );
        void checkAuth();
      }
    };

    const handleAuthSessionChanged = () => {
      debugAuthLog("[AuthContext] authSessionChanged event received, checking auth");
      void checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authSessionChanged", handleAuthSessionChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authSessionChanged", handleAuthSessionChanged);
    };
  }, [checkAuth]);

  useEffect(() => {
    const revalidateSession = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        emitAuthError(OFFLINE_SESSION_MESSAGE);
        return;
      }

      const now = Date.now();
      if (
        !canRevalidateSession(
          now,
          lastRevalidateAtRef.current,
          consecutiveNetworkFailuresRef.current,
        )
      ) {
        return;
      }
      lastRevalidateAtRef.current = now;
      void checkAuth();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateSession();
      }
    };

    const handleOnline = () => {
      consecutiveNetworkFailuresRef.current = 0;
      lastRevalidateAtRef.current = 0;
      void checkAuth();
    };

    const handleOffline = () => {
      emitAuthError(OFFLINE_SESSION_MESSAGE);
    };

    window.addEventListener("focus", revalidateSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("focus", revalidateSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [
    checkAuth,
    consecutiveNetworkFailuresRef,
    emitAuthError,
    lastRevalidateAtRef,
  ]);
}

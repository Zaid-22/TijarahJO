import { useSyncExternalStore } from "react";

function subscribeToOnlineStatus(onStatusChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("online", onStatusChange);
  window.addEventListener("offline", onStatusChange);

  return () => {
    window.removeEventListener("online", onStatusChange);
    window.removeEventListener("offline", onStatusChange);
  };
}

function getOnlineSnapshot() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
}

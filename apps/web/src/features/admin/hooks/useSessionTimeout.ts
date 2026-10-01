import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Show warning at 25 minutes (5 min before timeout)

export function getSessionTimeoutSnapshot(now: number, lastActivity: number) {
  const remainingMs = SESSION_TIMEOUT_MS - Math.max(0, now - lastActivity);
  return {
    isExpired: remainingMs <= 0,
    showWarning: remainingMs <= WARNING_BEFORE_MS && remainingMs > 0,
    minutesLeft: Math.max(0, Math.ceil(remainingMs / 60000)),
  };
}

/**
 * Hook that tracks user activity and provides session timeout warnings.
 * Returns: { showWarning, minutesLeft, resetTimer }
 */
export function useSessionTimeout(onExpire: () => void | Promise<void>) {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(30);
  const lastActivityRef = useRef(Date.now());
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const expireSession = useCallback(() => {
    if (hasExpiredRef.current) {
      return;
    }

    hasExpiredRef.current = true;
    setMinutesLeft(0);
    setShowWarning(false);
    try {
      void Promise.resolve(onExpireRef.current()).catch(() => undefined);
    } catch {
      // The session is still expired even if a caller's cleanup throws.
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (hasExpiredRef.current) {
      return;
    }

    const now = Date.now();
    if (getSessionTimeoutSnapshot(now, lastActivityRef.current).isExpired) {
      expireSession();
      return;
    }

    lastActivityRef.current = now;
    setMinutesLeft(30);
    setShowWarning(false);
  }, [expireSession]);

  // Track user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => {
      if (hasExpiredRef.current) {
        return;
      }

      const now = Date.now();
      if (getSessionTimeoutSnapshot(now, lastActivityRef.current).isExpired) {
        expireSession();
        return;
      }

      lastActivityRef.current = now;
      setShowWarning(false);
    };

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );
    return () =>
      events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [expireSession]);

  // Check timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = getSessionTimeoutSnapshot(Date.now(), lastActivityRef.current);
      setMinutesLeft(snapshot.minutesLeft);
      setShowWarning(snapshot.showWarning);

      if (snapshot.isExpired) {
        expireSession();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [expireSession]);

  return { showWarning, minutesLeft, resetTimer };
}

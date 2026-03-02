import { useState, useEffect, useCallback } from "react";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Show warning at 25 minutes (5 min before timeout)

/**
 * Hook that tracks user activity and provides session timeout warnings.
 * Returns: { showWarning, minutesLeft, resetTimer }
 */
export function useSessionTimeout() {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(30);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Track user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );
    return () =>
      events.forEach((e) => window.removeEventListener(e, onActivity));
  }, []);

  // Check timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = SESSION_TIMEOUT_MS - elapsed;
      const mins = Math.max(0, Math.ceil(remaining / 60000));
      setMinutesLeft(mins);

      if (remaining <= WARNING_BEFORE_MS && remaining > 0) {
        setShowWarning(true);
      } else if (remaining <= 0) {
        setShowWarning(false);
        // Session expired — could redirect to login here
      } else {
        setShowWarning(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastActivity]);

  return { showWarning, minutesLeft, resetTimer };
}

import { useEffect, useCallback } from "react";

type KeyAction = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  /** If true, this shortcut won't fire when inside an input/textarea/select */
  ignoreInputs?: boolean;
};

/**
 * Hook that registers global keyboard shortcuts.
 * Automatically prevents shortcuts from firing inside input fields unless `ignoreInputs` is false.
 */
export function useAdminKeyboardShortcuts(actions: KeyAction[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        target.tagName,
      );

      for (const action of actions) {
        if (action.ignoreInputs !== false && isInInput) continue;
        if (e.key !== action.key) continue;
        if (action.ctrl && !e.ctrlKey && !e.metaKey) continue;
        if (action.shift && !e.shiftKey) continue;

        e.preventDefault();
        action.handler();
        return;
      }
    },
    [actions],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

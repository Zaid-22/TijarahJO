const DEBUG_LOGS_ENABLED =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_DEBUG_LOGS === "true";

export const logger = {
  debug: (...args: unknown[]) => {
    if (!DEBUG_LOGS_ENABLED) {
      return;
    }

    console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (!DEBUG_LOGS_ENABLED) {
      return;
    }

    console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (!DEBUG_LOGS_ENABLED) {
      return;
    }

    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (!DEBUG_LOGS_ENABLED) {
      return;
    }

    console.error(...args);
  },
};


/**
 * Wraps a dynamic import for React.lazy with a one-shot page-reload retry.
 *
 * If the import fails with a recoverable "Failed to fetch dynamically imported
 * module" error (common after deploys that invalidate hashed chunk filenames),
 * the helper stores a session flag and reloads the page once. On the second
 * attempt, if the flag is already set, the original error propagates so the
 * app's error boundary can handle it instead of looping.
 */
export function lazyImportWithRetry<TModule>(
  load: () => Promise<TModule>,
  retryKey: string,
) {
  return async () => {
    try {
      const module = await load();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(retryKey);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRecoverableImportError =
        /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
          message,
        );

      if (
        typeof window !== "undefined" &&
        isRecoverableImportError &&
        !window.sessionStorage.getItem(retryKey)
      ) {
        window.sessionStorage.setItem(retryKey, "1");
        window.location.reload();

        return new Promise<never>(() => {
          // Keep React.lazy pending while the page reload is in flight.
        });
      }

      throw error;
    }
  };
}

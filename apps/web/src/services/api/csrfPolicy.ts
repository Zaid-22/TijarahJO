const ANONYMOUS_AUTH_WRITE_ENDPOINTS = [
  "/auth/login",
  "/auth/signup",
  "/auth/2fa/verify-login",
  "/auth/forgot-password/request",
  "/auth/forgot-password/verify",
  "/auth/forgot-password/confirm",
] as const;

export function shouldPrimeCsrfForEndpoint(endpoint?: string): boolean {
  if (!endpoint) {
    return true;
  }

  return !ANONYMOUS_AUTH_WRITE_ENDPOINTS.some((path) =>
    endpoint.startsWith(path),
  );
}

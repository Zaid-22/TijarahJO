/**
 * Canonical localStorage/sessionStorage key names for auth-related state.
 *
 * Kept in a standalone module with zero dependencies so both the low-level
 * API client (services/api/client.ts) and the auth context layer
 * (contexts/authContextUtils.ts) can import from here without creating a
 * circular dependency.
 */

export const AUTH_LOGOUT_KEY = "tijarahjo_logged_out";
export const AUTH_SESSION_HINT_KEY = "tijarahjo_has_authenticated";
export const AUTH_ADMIN_ACCESS_HINT_KEY = "tijarahjo_has_admin_access";
export const AUTH_GUEST_KEY = "guestMode";
export const AUTH_LEGACY_KEYS: string[] = [
  "tijarahjo_token",
  "tijarahjo_auth",
  "tijarahjo_user",
];

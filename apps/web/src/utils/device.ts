/**
 * Detect if the current device is a phone (capable of making calls via `tel:` links).
 */
export function isMobilePhone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android.*Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(
    ua,
  );
}

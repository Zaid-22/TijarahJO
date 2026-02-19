export const AUTH_NETWORK_RETRY_BASE_DELAY_MS = 800;
export const AUTH_NETWORK_RETRY_MAX_DELAY_MS = 15_000;
export const AUTH_REVALIDATE_BASE_THROTTLE_MS = 5_000;
export const AUTH_REVALIDATE_MAX_THROTTLE_MS = 60_000;
export const AUTH_ERROR_EMIT_COOLDOWN_MS = 12_000;
export const AUTH_MAX_CONSECUTIVE_NETWORK_FAILURES = 8;
export const OFFLINE_SESSION_MESSAGE =
  "You are offline. Session verification will resume when connection is restored.";

export type AuthCheckOutcome = "success" | "auth_error" | "network_error";

export type ErrorEmissionState = {
  message: string;
  emittedAt: number;
};

function normalizeFailureCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

export function getNetworkRetryDelayMs(consecutiveFailures: number): number {
  const normalizedFailures = normalizeFailureCount(consecutiveFailures);
  const delay = AUTH_NETWORK_RETRY_BASE_DELAY_MS * 2 ** normalizedFailures;
  return Math.min(AUTH_NETWORK_RETRY_MAX_DELAY_MS, delay);
}

export function getRevalidateThrottleMs(consecutiveFailures: number): number {
  const normalizedFailures = normalizeFailureCount(consecutiveFailures);
  const exponent = Math.max(0, normalizedFailures - 1);
  const throttle = AUTH_REVALIDATE_BASE_THROTTLE_MS * 2 ** exponent;
  return Math.min(AUTH_REVALIDATE_MAX_THROTTLE_MS, throttle);
}

export function getNextConsecutiveNetworkFailures(
  previousFailures: number,
  outcome: AuthCheckOutcome,
): number {
  if (outcome !== "network_error") {
    return 0;
  }

  const normalizedPrevious = normalizeFailureCount(previousFailures);
  return Math.min(
    AUTH_MAX_CONSECUTIVE_NETWORK_FAILURES,
    normalizedPrevious + 1,
  );
}

export function canRevalidateSession(
  nowMs: number,
  lastRevalidateAtMs: number,
  consecutiveFailures: number,
): boolean {
  const elapsed = nowMs - lastRevalidateAtMs;
  return elapsed >= getRevalidateThrottleMs(consecutiveFailures);
}

export function shouldEmitAuthError(
  previous: ErrorEmissionState,
  nextMessage: string,
  nowMs: number,
  cooldownMs: number,
): boolean {
  const elapsed = nowMs - previous.emittedAt;
  const isDuplicateWithinCooldown =
    previous.message === nextMessage && elapsed < cooldownMs;

  return !isDuplicateWithinCooldown;
}

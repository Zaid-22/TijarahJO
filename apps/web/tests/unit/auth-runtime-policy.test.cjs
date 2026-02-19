const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AUTH_ERROR_EMIT_COOLDOWN_MS,
  getNetworkRetryDelayMs,
  getRevalidateThrottleMs,
  getNextConsecutiveNetworkFailures,
  canRevalidateSession,
  shouldEmitAuthError,
} = require("../../.unit-dist/contexts/authRuntimePolicy.js");

test("getNetworkRetryDelayMs applies exponential backoff with max cap", () => {
  assert.equal(getNetworkRetryDelayMs(-1), 800);
  assert.equal(getNetworkRetryDelayMs(0), 800);
  assert.equal(getNetworkRetryDelayMs(1), 1600);
  assert.equal(getNetworkRetryDelayMs(2), 3200);
  assert.equal(getNetworkRetryDelayMs(4), 12800);
  assert.equal(getNetworkRetryDelayMs(5), 15000);
  assert.equal(getNetworkRetryDelayMs(10), 15000);
});

test("getRevalidateThrottleMs scales and caps under repeated failures", () => {
  assert.equal(getRevalidateThrottleMs(0), 5000);
  assert.equal(getRevalidateThrottleMs(1), 5000);
  assert.equal(getRevalidateThrottleMs(2), 10000);
  assert.equal(getRevalidateThrottleMs(3), 20000);
  assert.equal(getRevalidateThrottleMs(5), 60000);
  assert.equal(getRevalidateThrottleMs(12), 60000);
});

test("getNextConsecutiveNetworkFailures resets on non-network outcomes", () => {
  assert.equal(getNextConsecutiveNetworkFailures(0, "network_error"), 1);
  assert.equal(getNextConsecutiveNetworkFailures(1, "network_error"), 2);
  assert.equal(getNextConsecutiveNetworkFailures(8, "network_error"), 8);
  assert.equal(getNextConsecutiveNetworkFailures(4, "success"), 0);
  assert.equal(getNextConsecutiveNetworkFailures(4, "auth_error"), 0);
});

test("canRevalidateSession enforces adaptive throttle windows", () => {
  assert.equal(canRevalidateSession(5_999, 1_000, 0), false);
  assert.equal(canRevalidateSession(6_000, 1_000, 0), true);

  assert.equal(canRevalidateSession(10_999, 1_000, 2), false);
  assert.equal(canRevalidateSession(11_000, 1_000, 2), true);
});

test("shouldEmitAuthError deduplicates same message during cooldown", () => {
  const previous = {
    message: "Cannot verify your session right now.",
    emittedAt: 1_000,
  };

  assert.equal(
    shouldEmitAuthError(
      previous,
      "Cannot verify your session right now.",
      1_000 + AUTH_ERROR_EMIT_COOLDOWN_MS - 1,
      AUTH_ERROR_EMIT_COOLDOWN_MS,
    ),
    false,
  );

  assert.equal(
    shouldEmitAuthError(
      previous,
      "Cannot verify your session right now.",
      1_000 + AUTH_ERROR_EMIT_COOLDOWN_MS,
      AUTH_ERROR_EMIT_COOLDOWN_MS,
    ),
    true,
  );

  assert.equal(
    shouldEmitAuthError(
      previous,
      "You are offline.",
      1_500,
      AUTH_ERROR_EMIT_COOLDOWN_MS,
    ),
    true,
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AUTH_NETWORK_RETRY_MAX_DELAY_MS,
  AUTH_REVALIDATE_MAX_THROTTLE_MS,
  getNetworkRetryDelayMs,
  getRevalidateThrottleMs,
  getNextConsecutiveNetworkFailures,
  canRevalidateSession,
} = require("../../.unit-dist/contexts/authRuntimePolicy.js");

test("auth runtime resilience flow ramps retries and resets after success", () => {
  let failures = 0;

  failures = getNextConsecutiveNetworkFailures(failures, "network_error");
  failures = getNextConsecutiveNetworkFailures(failures, "network_error");
  failures = getNextConsecutiveNetworkFailures(failures, "network_error");

  const retryDelay = getNetworkRetryDelayMs(failures);
  const throttleDelay = getRevalidateThrottleMs(failures);

  assert.ok(retryDelay > 0);
  assert.ok(throttleDelay > 0);
  assert.ok(retryDelay <= AUTH_NETWORK_RETRY_MAX_DELAY_MS);
  assert.ok(throttleDelay <= AUTH_REVALIDATE_MAX_THROTTLE_MS);

  const now = 100_000;
  const lastCheck = now - throttleDelay + 1;
  assert.equal(canRevalidateSession(now, lastCheck, failures), false);
  assert.equal(canRevalidateSession(now, now - throttleDelay, failures), true);

  failures = getNextConsecutiveNetworkFailures(failures, "success");
  assert.equal(failures, 0);
  assert.equal(getNetworkRetryDelayMs(failures), 800);
});

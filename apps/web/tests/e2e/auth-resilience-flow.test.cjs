const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getNetworkRetryDelayMs,
  getNextConsecutiveNetworkFailures,
  canRevalidateSession,
} = require("../../.unit-dist/contexts/authRuntimePolicy.js");

test("auth runtime resilience flow ramps retries and resets after success", () => {
  let failures = 0;

  failures = getNextConsecutiveNetworkFailures(failures, "network_error");
  failures = getNextConsecutiveNetworkFailures(failures, "network_error");
  failures = getNextConsecutiveNetworkFailures(failures, "network_error");

  const retryDelay = getNetworkRetryDelayMs(failures);

  assert.ok(retryDelay > 0);
  assert.ok(retryDelay <= 15000);

  const now = 100_000;
  const throttleDelay = 20000;
  const lastCheck = now - throttleDelay + 1;
  assert.equal(canRevalidateSession(now, lastCheck, failures), false);
  assert.equal(canRevalidateSession(now, now - throttleDelay, failures), true);

  failures = getNextConsecutiveNetworkFailures(failures, "success");
  assert.equal(failures, 0);
  assert.equal(getNetworkRetryDelayMs(failures), 800);
});

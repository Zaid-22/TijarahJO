const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getSessionTimeoutSnapshot,
} = require("../../.unit-dist/features/admin/hooks/useSessionTimeout.js");

test("admin session timeout warns before expiry and expires at 30 minutes", () => {
  const startedAt = 1_000;
  const warning = getSessionTimeoutSnapshot(startedAt + 25 * 60 * 1_000, startedAt);
  const expired = getSessionTimeoutSnapshot(startedAt + 30 * 60 * 1_000, startedAt);

  assert.equal(warning.showWarning, true);
  assert.equal(warning.isExpired, false);
  assert.equal(warning.minutesLeft, 5);
  assert.equal(expired.showWarning, false);
  assert.equal(expired.isExpired, true);
  assert.equal(expired.minutesLeft, 0);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AUTH_ERROR_EMIT_COOLDOWN_MS,
  OFFLINE_SESSION_MESSAGE,
  shouldEmitAuthError,
} = require("../../.unit-dist/contexts/authRuntimePolicy.js");

const BACKEND_UNAVAILABLE_MESSAGE =
  "Cannot verify your session right now. Please check your connection and try again.";

function nextEmission(previous, message, nowMs) {
  const shouldEmit = shouldEmitAuthError(
    previous,
    message,
    nowMs,
    AUTH_ERROR_EMIT_COOLDOWN_MS,
  );

  if (!shouldEmit) {
    return { emitted: false, state: previous };
  }

  return {
    emitted: true,
    state: {
      message,
      emittedAt: nowMs,
    },
  };
}

test("offline flap emits a single offline toast during cooldown", () => {
  let state = { message: "", emittedAt: 0 };

  const first = nextEmission(state, OFFLINE_SESSION_MESSAGE, 1_000);
  assert.equal(first.emitted, true);
  state = first.state;

  const repeated = nextEmission(state, OFFLINE_SESSION_MESSAGE, 2_000);
  assert.equal(repeated.emitted, false);

  const nearCooldownEnd = nextEmission(
    state,
    OFFLINE_SESSION_MESSAGE,
    1_000 + AUTH_ERROR_EMIT_COOLDOWN_MS - 1,
  );
  assert.equal(nearCooldownEnd.emitted, false);
});

test("offline -> online transition allows a different network toast immediately", () => {
  let state = { message: "", emittedAt: 0 };

  const offline = nextEmission(state, OFFLINE_SESSION_MESSAGE, 1_000);
  assert.equal(offline.emitted, true);
  state = offline.state;

  // Simulate reconnect where first revalidation still fails with backend unavailable.
  const afterOnlineNetworkFailure = nextEmission(
    state,
    BACKEND_UNAVAILABLE_MESSAGE,
    2_000,
  );
  assert.equal(afterOnlineNetworkFailure.emitted, true);
  state = afterOnlineNetworkFailure.state;

  const duplicateNetworkFailure = nextEmission(
    state,
    BACKEND_UNAVAILABLE_MESSAGE,
    3_000,
  );
  assert.equal(duplicateNetworkFailure.emitted, false);
});

test("timeline emits once per message per cooldown window", () => {
  let state = { message: "", emittedAt: 0 };
  const emittedMessages = [];

  const timeline = [
    { now: 1_000, message: OFFLINE_SESSION_MESSAGE },
    { now: 1_500, message: OFFLINE_SESSION_MESSAGE },
    { now: 2_000, message: BACKEND_UNAVAILABLE_MESSAGE },
    { now: 2_300, message: BACKEND_UNAVAILABLE_MESSAGE },
    {
      now: 2_000 + AUTH_ERROR_EMIT_COOLDOWN_MS,
      message: BACKEND_UNAVAILABLE_MESSAGE,
    },
  ];

  for (const event of timeline) {
    const result = nextEmission(state, event.message, event.now);
    if (result.emitted) {
      emittedMessages.push(event.message);
      state = result.state;
    }
  }

  assert.deepEqual(emittedMessages, [
    OFFLINE_SESSION_MESSAGE,
    BACKEND_UNAVAILABLE_MESSAGE,
    BACKEND_UNAVAILABLE_MESSAGE,
  ]);
});

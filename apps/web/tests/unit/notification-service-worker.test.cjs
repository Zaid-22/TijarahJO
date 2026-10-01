const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const workerSource = readFileSync(
  path.resolve(__dirname, "../../public/notifications-sw.js"),
  "utf8",
);

function createWorkerHarness(windowClients = []) {
  const listeners = new Map();
  const shownNotifications = [];
  const openedWindows = [];
  const workerGlobal = {
    location: { origin: "https://tijarahjo.example" },
    registration: {
      async showNotification(title, options) {
        shownNotifications.push({ options, title });
      },
    },
    clients: {
      async matchAll() {
        return windowClients;
      },
      async openWindow(routeUrl) {
        openedWindows.push(routeUrl);
      },
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };

  vm.runInNewContext(workerSource, {
    Promise,
    String,
    URL,
    self: workerGlobal,
  });

  async function dispatch(type, event) {
    let completion;
    listeners.get(type)({
      ...event,
      waitUntil(promise) {
        completion = Promise.resolve(promise);
      },
    });
    await completion;
  }

  return { dispatch, openedWindows, shownNotifications };
}

test("push notifications keep internal routes and reject external navigation", async () => {
  const harness = createWorkerHarness();

  await harness.dispatch("push", {
    data: {
      json: () => ({
        body: "A buyer sent a message",
        routeUrl: "/chat/42?from=push#latest",
        title: "New message",
      }),
    },
  });
  await harness.dispatch("push", {
    data: {
      json: () => ({
        routeUrl: "https://attacker.example/phishing",
        title: "Untrusted route",
      }),
    },
  });

  assert.equal(
    harness.shownNotifications[0].options.data.routeUrl,
    "/chat/42?from=push#latest",
  );
  assert.equal(harness.shownNotifications[1].options.data.routeUrl, "/chat");
});

test("notification clicks navigate an existing client with a sanitized route", async () => {
  const navigatedRoutes = [];
  let focusCount = 0;
  const harness = createWorkerHarness([
    {
      async focus() {
        focusCount += 1;
      },
      async navigate(routeUrl) {
        navigatedRoutes.push(routeUrl);
      },
    },
  ]);

  await harness.dispatch("notificationclick", {
    notification: {
      close() {},
      data: { routeUrl: "javascript:alert(1)" },
    },
  });

  assert.deepEqual(navigatedRoutes, ["/chat"]);
  assert.equal(focusCount, 1);
  assert.deepEqual(harness.openedWindows, []);
});

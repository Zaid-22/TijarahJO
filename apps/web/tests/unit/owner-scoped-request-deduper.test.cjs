const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createOwnerScopedRequestDeduper,
} = require("../../.unit-dist/services/api/ownerScopedRequestDeduper.js");

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("unread-count request sharing never crosses account owners", async () => {
  const dedupe = createOwnerScopedRequestDeduper();
  const accountA = deferred();
  const accountB = deferred();
  let requestCount = 0;

  const firstARequest = dedupe("account-a", () => {
    requestCount += 1;
    return accountA.promise;
  });
  const secondARequest = dedupe("account-a", () => {
    requestCount += 1;
    return Promise.resolve("unexpected duplicate");
  });
  const accountBRequest = dedupe("account-b", () => {
    requestCount += 1;
    return accountB.promise;
  });

  assert.strictEqual(secondARequest, firstARequest);
  assert.notStrictEqual(accountBRequest, firstARequest);
  assert.equal(requestCount, 2);

  accountB.resolve("B count");
  accountA.resolve("A count");

  assert.equal(await firstARequest, "A count");
  assert.equal(await accountBRequest, "B count");
});

test("settled owner requests are evicted from the dedupe cache", async () => {
  const dedupe = createOwnerScopedRequestDeduper();
  let requestCount = 0;

  assert.equal(
    await dedupe("account-a", async () => {
      requestCount += 1;
      return 1;
    }),
    1,
  );
  assert.equal(
    await dedupe("account-a", async () => {
      requestCount += 1;
      return 2;
    }),
    2,
  );
  assert.equal(requestCount, 2);
});

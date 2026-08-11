const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canAdoptProfileForAuthTransition,
  createProfileForAuthUser,
  isOwnedProfileRequestCurrent,
} = require("../../.unit-dist/features/auth/profileState.js");

test("profile state is empty between account owners and does not carry A into B", () => {
  const accountA = createProfileForAuthUser({
    id: "1",
    email: "a@example.com",
    name: "Account A",
    avatar: "https://example.com/a.jpg",
    role: "user",
  });
  accountA.phone = "0790000000";
  accountA.bio = "private A bio";

  const signedOut = createProfileForAuthUser(null);
  const accountB = createProfileForAuthUser({
    id: "2",
    email: "b@example.com",
    name: "Account B",
    role: "user",
  });

  assert.equal(signedOut.id, "");
  assert.equal(signedOut.phone, "");
  assert.equal(accountB.id, "2");
  assert.equal(accountB.phone, "");
  assert.equal(accountB.bio, "");
  assert.equal(accountB.avatar, null);
});

test("a stale A profile response cannot commit after ownership moves to B", () => {
  assert.equal(
    isOwnedProfileRequestCurrent({
      requestRunId: 4,
      currentRunId: 5,
      requestedUserId: "1",
      profileOwnerId: "2",
    }),
    false,
  );
  assert.equal(
    isOwnedProfileRequestCurrent({
      requestRunId: 5,
      currentRunId: 5,
      requestedUserId: "2",
      profileOwnerId: "2",
    }),
    true,
  );
});

test("login can synchronously hydrate a new owner before auth context rerenders", () => {
  assert.equal(
    canAdoptProfileForAuthTransition({
      expectedPreviousOwnerId: "",
      nextOwnerId: "2",
      profileOwnerId: "",
      renderedAuthUserId: "",
    }),
    true,
  );
  assert.equal(
    canAdoptProfileForAuthTransition({
      expectedPreviousOwnerId: "1",
      nextOwnerId: "2",
      profileOwnerId: "1",
      renderedAuthUserId: "1",
    }),
    true,
  );
});

test("a stale auth callback cannot reclaim profile ownership after B renders", () => {
  assert.equal(
    canAdoptProfileForAuthTransition({
      expectedPreviousOwnerId: "1",
      nextOwnerId: "1",
      profileOwnerId: "2",
      renderedAuthUserId: "2",
    }),
    false,
  );
});

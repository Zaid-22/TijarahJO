const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isChatMessageForParticipants,
  isOwnedChatScope,
} = require("../../.unit-dist/features/chat/chatOwnership.js");

test("chat messages require both the active account and selected recipient", () => {
  const messageForA = { senderId: 20, receiverId: 10 };

  assert.equal(isChatMessageForParticipants(messageForA, 10, 20), true);
  assert.equal(isChatMessageForParticipants(messageForA, 11, 20), false);
  assert.equal(isChatMessageForParticipants(messageForA, 10, 30), false);
});

test("chat list data is hidden after account ownership changes", () => {
  assert.equal(isOwnedChatScope("10", "10"), true);
  assert.equal(isOwnedChatScope("11", "10"), false);
  assert.equal(isOwnedChatScope("", "10"), false);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeChatMessage,
} = require("../../.unit-dist/services/api/chatNormalization.js");

test("normalizeChatMessage maps mixed-case backend shape", () => {
  const normalized = normalizeChatMessage({
    MessageId: "12",
    senderId: "4",
    ReceiverId: 7,
    PostId: "99",
    Content: "  hello world  ",
    Timestamp: "2026-01-01T10:00:00.000Z",
    IsRead: 1,
  });

  assert.deepEqual(normalized, {
    messageId: 12,
    senderId: 4,
    receiverId: 7,
    postId: 99,
    content: "hello world",
    timestamp: "2026-01-01T10:00:00.000Z",
    isRead: true,
  });
});

test("normalizeChatMessage rejects missing required fields", () => {
  assert.equal(
    normalizeChatMessage({
      senderId: "x",
      receiverId: 7,
      content: "hello",
    }),
    null,
  );

  assert.equal(
    normalizeChatMessage({
      senderId: 3,
      receiverId: 7,
      content: "   ",
    }),
    null,
  );
});

test("normalizeChatMessage normalizes optional ids and invalid timestamps safely", () => {
  const before = Date.now();
  const normalized = normalizeChatMessage({
    senderId: 3,
    receiverId: 7,
    messageId: "bad-id",
    postId: 0,
    content: "ok",
    timestamp: "not-a-date",
  });
  const after = Date.now();

  assert.ok(normalized);
  assert.equal(normalized.messageId, undefined);
  assert.equal(normalized.postId, undefined);
  assert.equal(normalized.isRead, false);

  const parsedTs = Date.parse(normalized.timestamp);
  assert.equal(Number.isNaN(parsedTs), false);
  assert.ok(parsedTs >= before && parsedTs <= after);
});

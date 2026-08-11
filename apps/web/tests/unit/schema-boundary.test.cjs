const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseChatMessagesPayload,
  parseSentChatMessagePayload,
  parsePresencePayload,
} = require("../../.unit-dist/services/api/schemas/chatSchema.js");
const {
  parseCategoryCollectionPayload,
  parseCategoryExistsPayload,
  parseCategoryPayload,
} = require("../../.unit-dist/services/api/schemas/categorySchema.js");

test("parseChatMessagesPayload supports envelope and direct array", () => {
  const envelopeMessages = parseChatMessagesPayload({
    data: [
      { messageId: 1, senderId: 7, receiverId: 8, content: "hello" },
      { messageId: 2, senderId: 8, receiverId: 7, content: "hi" },
    ],
  });
  assert.equal(envelopeMessages.length, 2);

  const directMessages = parseChatMessagesPayload([
    { MessageId: 3, SenderId: 10, ReceiverId: 11, Content: "ok" },
  ]);
  assert.equal(directMessages.length, 1);
});

test("parseSentChatMessagePayload unwraps envelope message", () => {
  const parsed = parseSentChatMessagePayload({
    message: {
      MessageId: 5,
      SenderId: 10,
      ReceiverId: 11,
      Content: "sent",
    },
  });

  assert.ok(parsed);
  assert.equal(parsed.MessageId, 5);
  assert.equal(parsed.SenderId, 10);
  assert.equal(parsed.ReceiverId, 11);
  assert.equal(parsed.Content, "sent");
});

test("parseSentChatMessagePayload accepts the atomic image-send DTO", () => {
  const parsed = parseSentChatMessagePayload({
    messageId: 51,
    senderId: 10,
    receiverId: 11,
    postId: 9,
    conversationId: 4,
    content: "[chat-image] /api/v1/chat/images/51/download\nCaption",
    timestamp: "2026-08-09T12:00:00.000Z",
    isRead: false,
  });

  assert.ok(parsed);
  assert.equal(parsed.messageId, 51);
  assert.equal(parsed.receiverId, 11);
  assert.equal(parsed.content.includes("[chat-image]"), true);
});

test("parsePresencePayload supports nested presence envelope", () => {
  const parsed = parsePresencePayload({
    data: { IsOnline: true, LastSeenAtUtc: "2026-02-21T12:00:00.000Z" },
  });

  assert.equal(parsed.IsOnline, true);
  assert.equal(parsed.LastSeenAtUtc, "2026-02-21T12:00:00.000Z");
});

test("parseCategoryCollectionPayload supports data envelope", () => {
  const parsed = parseCategoryCollectionPayload({
    categories: [
      { CategoryID: 1, CategoryName: "Electronics" },
      { id: 2, name: "Home" },
    ],
  });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].CategoryID, 1);
  assert.equal(parsed[1].name, "Home");
});

test("parseCategoryPayload unwraps category envelope", () => {
  const parsed = parseCategoryPayload({
    data: { CategoryID: 3, CategoryName: "Furniture" },
  });

  assert.ok(parsed);
  assert.equal(parsed.CategoryID, 3);
  assert.equal(parsed.CategoryName, "Furniture");
});

test("parseCategoryExistsPayload supports boolean and envelope", () => {
  assert.equal(parseCategoryExistsPayload(true), true);
  assert.equal(parseCategoryExistsPayload({ exists: true }), true);
  assert.equal(parseCategoryExistsPayload({ data: true }), true);
  assert.equal(parseCategoryExistsPayload({ Exists: false }), false);
});

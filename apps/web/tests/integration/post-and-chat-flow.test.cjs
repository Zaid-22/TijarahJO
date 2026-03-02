const test = require("node:test");
const assert = require("node:assert/strict");

const {
  transformPostModelToPost,
} = require("../../.unit-dist/services/api/posts/mappers.js");
const {
  normalizeChatMessage,
} = require("../../.unit-dist/services/api/chatNormalization.js");
const {
  toPositiveIntegerId,
} = require("../../.unit-dist/utils/idValidation.js");

test("post + chat integration keeps IDs and status normalized across modules", () => {
  const post = transformPostModelToPost({
    PostID: "200",
    UserID: "42",
    CategoryID: "7",
    PostTitle: "Gaming PC",
    PostDescription: "RTX + 32GB RAM",
    Price: 1200,
    City: "Amman",
    Area: "Khalda",
    Status: "SOLD",
    CreatedAt: "2026-01-01T10:00:00.000Z",
    Images: ["https://cdn.example.com/post-200-1.jpg"],
  });

  const chatMessage = normalizeChatMessage({
    MessageId: "501",
    SenderId: "42",
    ReceiverId: "73",
    PostId: "200",
    Content: " Is this still available? ",
    Timestamp: "2026-01-01T11:00:00.000Z",
    IsRead: false,
  });

  assert.equal(post.id, "200");
  assert.equal(post.sellerId, "42");
  assert.equal(post.status, "SOLD");
  assert.equal(toPositiveIntegerId(post.id), 200);

  assert.ok(chatMessage);
  assert.equal(chatMessage.postId, 200);
  assert.equal(chatMessage.senderId, 42);
  assert.equal(chatMessage.receiverId, 73);
  assert.equal(chatMessage.content, "Is this still available?");
});

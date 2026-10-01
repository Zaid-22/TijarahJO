const test = require("node:test");
const assert = require("node:assert/strict");

const { parseAuthEnvelope } = require("../../.unit-dist/services/api/schemas/authSchema.js");
const {
  parseUserSchema,
  parseUsersCollection,
} = require("../../.unit-dist/services/api/schemas/userSchema.js");
const {
  parsePostComment,
  parseCommentListResponse,
} = require("../../.unit-dist/services/api/schemas/commentsSchema.js");
const {
  normalizePublicSystemStatusResponse,
} = require("../../.unit-dist/services/api/systemStatus.js");

test("parseAuthEnvelope normalizes backend auth payload", () => {
  const parsed = parseAuthEnvelope({
    Success: true,
    Message: "Login OK",
    User: {
      Id: 7,
      FirstName: "Ali",
      LastName: "Saleh",
      Email: "ali@example.com",
      Phone: "0799999999",
      City: "Amman",
      Area: "Khalda",
      RoleID: 1,
      IsDeleted: false,
      JoinedDate: "2026-01-01T00:00:00.000Z",
    },
  });

  assert.ok(parsed);
  assert.equal(parsed.successFlag, true);
  assert.equal(parsed.message, "Login OK");
  assert.ok(parsed.user);
  assert.equal(parsed.user.id, "7");
  assert.equal(parsed.user.firstName, "Ali");
  assert.equal(parsed.user.roleID, 1);
  assert.equal(parsed.user.isDeleted, false);
});

test("parseAuthEnvelope returns null for invalid payload", () => {
  assert.equal(parseAuthEnvelope(null), null);
  assert.equal(parseAuthEnvelope("invalid"), null);
});

test("parseUserSchema normalizes mixed casing and IDs", () => {
  const parsed = parseUserSchema(
    {
      UserID: "55",
      FirstName: "Mona",
      LastName: "Yousef",
      Email: "mona@example.com",
      Phone: "0788888888",
      City: "Zarqa",
      Area: "Downtown",
      Status: 2,
      RoleID: 2,
      IsDeleted: true,
      JoinDate: "2026-02-01T10:00:00.000Z",
    },
    "55",
  );

  assert.ok(parsed);
  assert.equal(parsed.id, "55");
  assert.equal(parsed.userId, 55);
  assert.equal(parsed.status, 2);
  assert.equal(parsed.roleId, 2);
  assert.equal(parsed.isDeleted, true);
  assert.equal(parsed.firstName, "Mona");
  assert.equal(parsed.lastName, "Yousef");
});

test("parseUserSchema rejects a payload with only a fallback identity", () => {
  assert.equal(parseUserSchema({}, "55"), null);
});

test("parseUsersCollection filters invalid entries", () => {
  const parsed = parseUsersCollection([
    { Id: 1, FirstName: "A" },
    null,
    "invalid",
    { id: "2", FirstName: "B" },
  ]);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, "1");
  assert.equal(parsed[1].id, "2");
});

test("parsePostComment normalizes PascalCase backend payload", () => {
  const parsed = parsePostComment({
    CommentID: 91,
    Id: "91",
    PostID: 12,
    UserID: 5,
    ParentCommentID: null,
    Content: "Hello world",
    CreatedAt: "2026-04-01T08:00:00.000Z",
    UpdatedAt: "2026-04-01T08:00:00.000Z",
    AuthorName: "Ali Saleh",
    AuthorAvatar: "/uploads/a.png",
    ReplyCount: 2,
    IsEdited: false,
  });

  assert.ok(parsed);
  assert.equal(parsed.commentId, 91);
  assert.equal(parsed.id, "91");
  assert.equal(parsed.postId, 12);
  assert.equal(parsed.userId, 5);
  assert.equal(parsed.content, "Hello world");
  assert.equal(parsed.authorName, "Ali Saleh");
  assert.equal(parsed.replyCount, 2);
  assert.equal(parsed.isEdited, false);
});

test("parseCommentListResponse normalizes comment collections", () => {
  const parsed = parseCommentListResponse({
    Comments: [
      {
        CommentID: 7,
        PostID: 3,
        UserID: 11,
        Content: "First",
        CreatedAt: "2026-04-01T08:00:00.000Z",
        UpdatedAt: "2026-04-01T08:00:00.000Z",
        ReplyCount: 0,
        IsEdited: false,
      },
    ],
    TotalCount: 1,
    Page: 1,
    PageSize: 20,
  });

  assert.ok(parsed);
  assert.equal(parsed.totalCount, 1);
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 20);
  assert.equal(parsed.comments.length, 1);
  assert.equal(parsed.comments[0].commentId, 7);
  assert.equal(parsed.comments[0].content, "First");
});

test("parsePostComment treats timezone-less backend timestamps as UTC", () => {
  const parsed = parsePostComment({
    CommentID: 19,
    PostID: 32,
    UserID: 1002,
    Content: "Recent comment",
    CreatedAt: "2026-04-01T09:54:32.450001",
    UpdatedAt: "2026-04-01T09:54:32.450001",
    ReplyCount: 0,
    IsEdited: false,
  });

  assert.ok(parsed);
  assert.equal(parsed.createdAt, "2026-04-01T09:54:32.450Z");
  assert.equal(parsed.updatedAt, "2026-04-01T09:54:32.450Z");
});

test("normalizePublicSystemStatusResponse treats maintenance 503 as maintenance mode", () => {
  const parsed = normalizePublicSystemStatusResponse({
    success: false,
    error: {
      code: "HTTP_503",
      message: "Service Unavailable",
      details: {
        code: "MAINTENANCE_MODE",
        detail: "TijarahJo is currently undergoing maintenance. Please try again later.",
      },
    },
  });

  assert.equal(parsed.maintenanceMode, true);
  assert.equal(parsed.serviceUnavailable, true);
  assert.match(parsed.maintenanceReason || "", /maintenance/i);
});

test("normalizePublicSystemStatusResponse pauses polling for generic 503 responses", () => {
  const parsed = normalizePublicSystemStatusResponse({
    success: false,
    error: {
      code: "HTTP_503",
      message: "Service Unavailable",
    },
  });

  assert.equal(parsed.maintenanceMode, false);
  assert.equal(parsed.serviceUnavailable, true);
  assert.equal(parsed.maintenanceReason, "Service Unavailable");
});

test("normalizePublicSystemStatusResponse keeps non-503 failures out of maintenance mode", () => {
  const parsed = normalizePublicSystemStatusResponse({
    success: false,
    error: {
      code: "CONNECTION_REFUSED",
      message: "Unable to connect to the server. Please try again later.",
    },
  });

  assert.equal(parsed.maintenanceMode, false);
  assert.equal(parsed.serviceUnavailable, false);
  assert.equal(parsed.maintenanceReason, undefined);
});

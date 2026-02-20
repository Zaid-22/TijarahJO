const test = require("node:test");
const assert = require("node:assert/strict");

const { parseAuthEnvelope } = require("../../.unit-dist/services/api/schemas/authSchema.js");
const {
  parseUserSchema,
  parseUsersCollection,
} = require("../../.unit-dist/services/api/schemas/userSchema.js");

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

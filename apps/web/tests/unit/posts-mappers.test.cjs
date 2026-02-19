const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeProductStatus,
  transformPostModelToProduct,
  getUserDisplayName,
  getUserIdentifier,
} = require("../../.unit-dist/services/api/posts/mappers.js");

test("normalizeProductStatus maps moderation-like states to DELETED", () => {
  assert.equal(normalizeProductStatus("blocked"), "DELETED");
  assert.equal(normalizeProductStatus("inactive"), "DELETED");
  assert.equal(normalizeProductStatus(1), "DELETED");
  assert.equal(normalizeProductStatus(2), "DELETED");
});

test("normalizeProductStatus maps SOLD and defaults ACTIVE", () => {
  assert.equal(normalizeProductStatus("sold"), "SOLD");
  assert.equal(normalizeProductStatus(3), "SOLD");
  assert.equal(normalizeProductStatus("anything-else"), "ACTIVE");
  assert.equal(normalizeProductStatus(undefined), "ACTIVE");
});

test("getUserIdentifier resolves canonical user id from mixed backend casing", () => {
  assert.equal(getUserIdentifier({ UserID: 12 }), "12");
  assert.equal(getUserIdentifier({ userID: "88" }), "88");
  assert.equal(getUserIdentifier({ id: "5" }), "5");
});

test("getUserDisplayName resolves explicit name > full name > email > fallback", () => {
  assert.equal(getUserDisplayName({ Name: "Seller X" }, "99"), "Seller X");
  assert.equal(
    getUserDisplayName({ FirstName: "Jane", LastName: "Doe" }, "99"),
    "Jane Doe",
  );
  assert.equal(
    getUserDisplayName({ Email: "jane@example.com" }, "99"),
    "jane@example.com",
  );
  assert.equal(getUserDisplayName(null, "99"), "User 99");
});

test("transformPostModelToProduct maps backend post shape to frontend product", () => {
  const product = transformPostModelToProduct(
    {
      PostID: 10,
      UserID: 4,
      CategoryID: 3,
      PostTitle: "Laptop",
      PostDescription: "16GB RAM",
      Price: 399,
      City: "Amman",
      Area: "Khalda",
      Seller: "Ali",
      Category: "Computers",
      CreatedAt: "2026-01-01T10:00:00.000Z",
      Views: 11,
      Status: 0,
      Images: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    },
    [],
  );

  assert.equal(product.id, "10");
  assert.equal(product.sellerId, "4");
  assert.equal(product.categoryId, "3");
  assert.equal(product.name, "Laptop");
  assert.equal(product.location, "Amman");
  assert.equal(product.area, "Khalda");
  assert.equal(product.status, "ACTIVE");
  assert.equal(product.image, "https://example.com/1.jpg");
  assert.deepEqual(product.images, [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
  ]);
});

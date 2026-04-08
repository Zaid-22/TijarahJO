const test = require("node:test");
const assert = require("node:assert/strict");

const {
  transformPostModelToPost,
  getUserDisplayName,
  getUserIdentifier,
} = require("../../.unit-dist/services/api/posts/mappers.js");
const {
  parseRawPost,
} = require("../../.unit-dist/services/api/schemas/postSchema.js");

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

test("transformPostModelToPost maps backend post shape to frontend post", () => {
  const post = transformPostModelToPost(
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

  assert.equal(post.id, "10");
  assert.equal(post.sellerId, "4");
  assert.equal(post.categoryId, "3");
  assert.equal(post.name, "Laptop");
  assert.equal(post.location, "Amman");
  assert.equal(post.area, "Khalda");
  assert.equal(post.status, "ACTIVE");
  assert.equal(post.image, "https://example.com/1.jpg");
  assert.deepEqual(post.images, [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
  ]);
});

test("transformPostModelToPost prefers thumbnail image for card previews", () => {
  const post = transformPostModelToPost(
    {
      PostID: 11,
      UserID: 4,
      CategoryID: 3,
      PostTitle: "Chair",
      Price: 99,
      City: "Amman",
      Seller: "Ali",
      Category: "Furniture",
      ThumbnailImage: "/uploads/post-images/11.thumb.webp",
      Images: ["https://example.com/full-1.jpg"],
    },
    [],
  );

  assert.equal(post.image, "http://localhost:5033/uploads/post-images/11.thumb.webp");
  assert.deepEqual(post.images, ["https://example.com/full-1.jpg"]);
});

test("parseRawPost preserves phone fields used by marketplace call actions", () => {
  const parsed = parseRawPost({
    PostID: 15,
    Phone: "+962791234567",
    phone: "+962791234567",
  });

  assert.ok(parsed);
  assert.equal(parsed.Phone, "+962791234567");
  assert.equal(parsed.phone, "+962791234567");
});

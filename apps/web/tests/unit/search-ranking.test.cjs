const test = require("node:test");
const assert = require("node:assert/strict");

const { rankPostsBySearch } = require("../../.unit-dist/lib/searchRanking.js");

function createPost(id, name, category = "Accessories") {
  return {
    id,
    name,
    price: 100,
    location: "Amman",
    seller: "Seller",
    sellerId: "seller-1",
    category,
    image: "https://example.com/item.jpg",
    status: "ACTIVE",
    description: name,
  };
}

test("single-token query car does not prefix-boost boundary-mismatched names", () => {
  const posts = [
    createPost("1", "carpet cleaner"),
    createPost("2", "carburetor"),
    createPost("3", "car cover"),
  ];

  const ranked = rankPostsBySearch(posts, "car");

  assert.equal(ranked[0]?.id, "3");
  assert.ok(
    ranked.findIndex((post) => post.id === "3") <
      ranked.findIndex((post) => post.id === "1"),
  );
  assert.ok(
    ranked.findIndex((post) => post.id === "3") <
      ranked.findIndex((post) => post.id === "2"),
  );
});

test("single-token query car still boosts boundary-safe category prefix", () => {
  const posts = [
    createPost("1", "seat protector", "carpet tools"),
    createPost("2", "basic cleaner", "carburetor parts"),
    createPost("3", "road kit", "car cover accessories"),
  ];

  const ranked = rankPostsBySearch(posts, "car");

  assert.equal(ranked[0]?.id, "3");
});

function buildPost(overrides = {}) {
  return {
    id: "1",
    name: "Generic Listing",
    price: 1000,
    location: "Amman",
    seller: "Seller",
    sellerId: "10",
    category: "General",
    image: "https://example.com/default.jpg",
    status: "ACTIVE",
    ...overrides,
  };
}

test("rankPostsBySearch ignores embedded substring token false positives", () => {
  const posts = [
    buildPost({
      id: "exact",
      name: "Pro Car",
      category: "Vehicles",
      description: "Well maintained pro car for sale",
      location: "Irbid",
      seller: "Hassan",
    }),
    buildPost({
      id: "embedded",
      name: "Improvised scarf holder",
      category: "Home",
      description: "Approach with improved materials",
      location: "Carolina district",
      seller: "Profile Stores",
    }),
  ];

  const ranked = rankPostsBySearch(posts, "pro car");

  assert.deepEqual(
    ranked.map((post) => post.id),
    ["exact"],
  );
});

test("rankPostsBySearch keeps exact-token matches ranked ahead of partial fields", () => {
  const posts = [
    buildPost({
      id: "exact-name",
      name: "Red Car",
      category: "Vehicles",
      description: "Excellent red car",
    }),
    buildPost({
      id: "token-only",
      name: "Family vehicle",
      category: "Vehicles",
      description: "A reliable red option for city driving",
    }),
    buildPost({
      id: "reversed",
      name: "Car Red",
      category: "Vehicles",
      description: "same words in reverse order",
    }),
  ];

  const ranked = rankPostsBySearch(posts, "red car");

  assert.deepEqual(
    ranked.map((post) => post.id),
    ["exact-name", "reversed", "token-only"],
  );
});

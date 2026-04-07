const test = require("node:test");
const assert = require("node:assert/strict");

const { rankPostsBySearch } = require("../../.unit-dist/lib/searchRanking.js");

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

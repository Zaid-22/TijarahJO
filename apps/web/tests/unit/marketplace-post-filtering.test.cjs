const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterAndSortMarketplacePosts,
} = require("../../.unit-dist/features/marketplace/search/marketplacePostFiltering.js");

function createPost(id, overrides = {}) {
  return {
    id,
    name: `Post ${id}`,
    price: 100,
    location: "Amman",
    seller: "Seller",
    sellerId: "seller-1",
    category: "Electronics",
    image: "https://example.com/item.jpg",
    status: "ACTIVE",
    views: 0,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

test("shared marketplace filtering applies all filters before sorting", () => {
  const posts = [
    createPost("1", { price: 250, views: 10 }),
    createPost("2", { price: 150, views: 20 }),
    createPost("3", { category: "Vehicles", price: 120, views: 30 }),
    createPost("4", { location: "Irbid", price: 140, views: 40 }),
  ];

  const result = filterAndSortMarketplacePosts(posts, {
    category: "electronics",
    city: "amm",
    minPrice: 100,
    maxPrice: 300,
    sortBy: "views",
    sortOrder: "desc",
  });

  assert.deepEqual(result.map((post) => post.id), ["2", "1"]);
});

test("route category predicate can replace the selected-category filter", () => {
  const posts = [
    createPost("1", { category: "Mobile Phones", price: 200 }),
    createPost("2", { category: "Electronics", price: 100 }),
  ];

  const result = filterAndSortMarketplacePosts(
    posts,
    { category: "ignored", sortBy: "price", sortOrder: "asc" },
    {
      matchesCategory: (category) => category === "Mobile Phones",
      applySelectedCategory: false,
    },
  );

  assert.deepEqual(result.map((post) => post.id), ["1"]);
});

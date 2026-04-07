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

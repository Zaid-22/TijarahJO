const test = require("node:test");
const assert = require("node:assert/strict");

const {
  shouldLoadPostsForPath,
  shouldLoadFavoritesForPath,
} = require("../../.unit-dist/app/routes/appRoutesUtils.js");

test("shouldLoadPostsForPath enables all current post-backed routes", () => {
  const postBackedRoutes = [
    "/",
    "/favorites",
    "/posts",
    "/search",
    "/profile",
    "/category/electronics",
  ];

  for (const route of postBackedRoutes) {
    assert.equal(
      shouldLoadPostsForPath(route),
      true,
      `expected posts to load on ${route}`,
    );
  }
});

test("shouldLoadPostsForPath keeps non-post routes disabled", () => {
  assert.equal(shouldLoadPostsForPath("/post/12"), false);
  assert.equal(shouldLoadPostsForPath("/seller/12"), false);
  assert.equal(shouldLoadPostsForPath("/settings"), false);
});

test("shouldLoadFavoritesForPath enables all current favorite-capable routes", () => {
  const favoriteCapableRoutes = [
    "/",
    "/favorites",
    "/posts",
    "/search",
    "/profile",
    "/category/electronics",
    "/post/12",
    "/seller/12",
    "/seller/12/",
  ];

  for (const route of favoriteCapableRoutes) {
    assert.equal(
      shouldLoadFavoritesForPath(route),
      true,
      `expected favorites to load on ${route}`,
    );
  }
});

test("shouldLoadFavoritesForPath keeps unrelated routes disabled", () => {
  assert.equal(shouldLoadFavoritesForPath("/chat/12"), false);
  assert.equal(shouldLoadFavoritesForPath("/settings"), false);
  assert.equal(shouldLoadFavoritesForPath("/help"), false);
});

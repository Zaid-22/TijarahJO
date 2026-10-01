const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyLoginUserDataToProfile,
  isOwnPostForUser,
  isProfileCompleteForRouting,
  resolveProfileCompletionReturnPath,
  shouldRouteToProfileCompletion,
  shouldLoadPostsForPath,
  shouldLoadFavoritesForPath,
} = require("../../.unit-dist/app/routes/appRoutesUtils.js");

function buildPostIdentity(sellerId, seller) {
  return {
    id: "post-1",
    name: "Listing",
    price: 1,
    location: "Amman",
    seller,
    sellerId,
    category: "Other",
    image: "",
  };
}

function buildUserIdentity(id, name) {
  return {
    id,
    name,
    email: "user@example.com",
    phone: "",
    location: "",
    bio: "",
    avatar: null,
    joinedDate: "",
  };
}

test("shouldLoadPostsForPath enables routes that consume the shared feed", () => {
  const postBackedRoutes = [
    "/",
    "/favorites",
    "/profile",
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
  assert.equal(shouldLoadPostsForPath("/posts"), false);
  assert.equal(shouldLoadPostsForPath("/search"), false);
  assert.equal(shouldLoadPostsForPath("/category/electronics"), false);
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

test("isOwnPostForUser gives IDs precedence over matching display names", () => {
  assert.equal(
    isOwnPostForUser(
      buildPostIdentity("10", "Same Name"),
      buildUserIdentity("20", "Same Name"),
      true,
    ),
    false,
  );
  assert.equal(
    isOwnPostForUser(
      buildPostIdentity("10", "Seller Name"),
      buildUserIdentity("10", "Different Name"),
      true,
    ),
    true,
  );
});

test("isOwnPostForUser only falls back to display name when both IDs are absent", () => {
  assert.equal(
    isOwnPostForUser(
      buildPostIdentity("", "Same Name"),
      buildUserIdentity("", "same name"),
      true,
    ),
    true,
  );
  assert.equal(
    isOwnPostForUser(
      buildPostIdentity("10", "Same Name"),
      buildUserIdentity("", "Same Name"),
      true,
    ),
    false,
  );
});

test("shouldRouteToProfileCompletion never turns a profile outage into a completion redirect", () => {
  const baseState = {
    isAuthenticated: true,
    isAuthLoading: false,
    isProfileLoading: false,
    isProfileComplete: false,
    hasProfileError: false,
  };

  assert.equal(shouldRouteToProfileCompletion(baseState), true);
  assert.equal(
    shouldRouteToProfileCompletion({
      ...baseState,
      hasProfileError: true,
    }),
    false,
  );
  assert.equal(
    shouldRouteToProfileCompletion({
      ...baseState,
      isProfileLoading: true,
    }),
    false,
  );
});

test("applyLoginUserDataToProfile does not carry phone and location across account switches", () => {
  const nextProfile = applyLoginUserDataToProfile(
    {
      id: "user-a",
      name: "User A",
      firstName: "User",
      lastName: "A",
      email: "a@example.com",
      phone: "0790000000",
      city: "Amman",
      area: "Abdoun",
      location: "Amman, Abdoun",
      bio: "",
      avatar: "https://example.com/a.png",
      joinedDate: "Apr 2026",
    },
    {
      id: "user-b",
      firstName: "User",
      lastName: "B",
      email: "b@example.com",
    },
  );

  assert.equal(nextProfile.phone, "");
  assert.equal(nextProfile.city, "");
  assert.equal(nextProfile.area, "");
  assert.equal(nextProfile.location, "");
  assert.equal(nextProfile.avatar, null);
  assert.equal(nextProfile.joinedDate, "");
});

test("applyLoginUserDataToProfile preserves profile details for the same account", () => {
  const nextProfile = applyLoginUserDataToProfile(
    {
      id: "user-a",
      name: "User A",
      firstName: "User",
      lastName: "A",
      email: "a@example.com",
      phone: "0790000000",
      city: "Amman",
      area: "Abdoun",
      location: "Amman, Abdoun",
      bio: "",
      avatar: "https://example.com/a.png",
      joinedDate: "Apr 2026",
    },
    {
      id: "user-a",
      firstName: "User",
      lastName: "A",
      email: "a@example.com",
    },
  );

  assert.equal(nextProfile.phone, "0790000000");
  assert.equal(nextProfile.city, "Amman");
  assert.equal(nextProfile.area, "Abdoun");
  assert.equal(nextProfile.location, "Amman, Abdoun");
  assert.equal(nextProfile.avatar, "https://example.com/a.png");
  assert.equal(nextProfile.joinedDate, "Apr 2026");
});

test("isProfileCompleteForRouting only trusts fresh login payload fields", () => {
  assert.equal(
    isProfileCompleteForRouting({
      firstName: "User",
      lastName: "B",
      email: "b@example.com",
      phone: "",
      city: "Amman",
      area: "Abdoun",
    }),
    false,
  );

  assert.equal(
    isProfileCompleteForRouting({
      firstName: "User",
      lastName: "B",
      email: "b@example.com",
      phone: "0790000000",
      cityId: 1,
      areaId: 2,
    }),
    true,
  );
});

test("resolveProfileCompletionReturnPath preserves safe deep links", () => {
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/post/42",
      search: "?source=favorites",
    }),
    "/post/42?source=favorites",
  );
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/login",
      fromPath: "/seller/8?tab=reviews",
    }),
    "/seller/8?tab=reviews",
  );
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/post/42",
      search: "?source=favorites",
      fromPath: "/search?q=phones",
    }),
    "/post/42?source=favorites",
  );
});

test("resolveProfileCompletionReturnPath rejects auth loops and external URLs", () => {
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/login",
      fromPath: "//example.com/private",
    }),
    "/",
  );
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/complete-profile",
    }),
    "/",
  );
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/post/42",
      fromPath: "/Complete-Profile?next=/post/42",
    }),
    "/post/42",
  );
  assert.equal(
    resolveProfileCompletionReturnPath({
      pathname: "/post/42",
      fromPath: "/\\evil.example/private",
    }),
    "/post/42",
  );
});

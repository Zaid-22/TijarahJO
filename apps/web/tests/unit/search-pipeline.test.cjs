const test = require("node:test");
const assert = require("node:assert/strict");

const {
  runSearchPipeline,
} = require("../../.unit-dist/features/marketplace/search/searchPipeline.js");

function createPost(id, name) {
  return {
    id,
    name,
    price: 10,
    location: "Amman",
    seller: "Seller",
    sellerId: "1",
    category: "Other",
    image: "",
    status: "ACTIVE",
  };
}

test("successful paginated search stays authoritative", async () => {
  const remotePost = createPost("remote", "Remote result");
  const fallbackPost = createPost("fallback", "Cached result");
  const pagination = {
    currentPage: 2,
    totalPages: 8,
    totalPosts: 91,
    postsPerPage: 12,
  };

  const result = await runSearchPipeline({
    request: async () => ({
      success: true,
      posts: [remotePost],
      pagination,
    }),
    buildFallbackPosts: () => [fallbackPost],
    fallbackErrorMessage: "Search failed",
  });

  assert.deepEqual(result.posts, [remotePost]);
  assert.deepEqual(result.pagination, pagination);
  assert.equal(result.error, null);
});

test("failed search retains cached fallback data", async () => {
  const fallbackPost = createPost("fallback", "Cached result");

  const result = await runSearchPipeline({
    request: async () => ({
      success: false,
      posts: [],
      error: { message: "Backend unavailable" },
    }),
    buildFallbackPosts: () => [fallbackPost],
    fallbackErrorMessage: "Search failed",
  });

  assert.deepEqual(result.posts, [fallbackPost]);
  assert.equal(result.error, null);
});

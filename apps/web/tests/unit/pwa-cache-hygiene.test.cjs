const test = require("node:test");
const assert = require("node:assert/strict");

const {
  purgeLegacySensitiveRuntimeCaches,
} = require("../../.unit-dist/shared/pwa/cacheHygiene.js");

test("legacy broad image cache is deleted", async () => {
  const deletedNames = [];
  const purged = await purgeLegacySensitiveRuntimeCaches({
    delete: async (cacheName) => {
      deletedNames.push(cacheName);
      return true;
    },
  });

  assert.deepEqual(deletedNames, ["image-cache"]);
  assert.deepEqual(purged, ["image-cache"]);
});

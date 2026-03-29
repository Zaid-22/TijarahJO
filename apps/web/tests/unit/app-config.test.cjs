const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeApiBaseUrl,
} = require("../../.unit-dist/constants/appConfig.js");

test("normalizeApiBaseUrl appends /v1 for legacy /api values", () => {
  assert.equal(
    normalizeApiBaseUrl("http://localhost:5033/api"),
    "http://localhost:5033/api/v1",
  );
});

test("normalizeApiBaseUrl canonicalizes local loopback hosts to localhost", () => {
  assert.equal(
    normalizeApiBaseUrl("http://127.0.0.1:5033/api/v1/"),
    "http://localhost:5033/api/v1",
  );
});

test("normalizeApiBaseUrl preserves non-loopback hosts", () => {
  assert.equal(
    normalizeApiBaseUrl("https://api.example.com/api/v1/"),
    "https://api.example.com/api/v1",
  );
});

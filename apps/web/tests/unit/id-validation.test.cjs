const test = require("node:test");
const assert = require("node:assert/strict");

const {
  toPositiveIntegerId,
} = require("../../.unit-dist/utils/idValidation.js");

test("toPositiveIntegerId accepts strict positive integer values", () => {
  assert.equal(toPositiveIntegerId(9), 9);
  assert.equal(toPositiveIntegerId("42"), 42);
  assert.equal(toPositiveIntegerId("0007"), 7);
  assert.equal(toPositiveIntegerId(9n), 9);
});

test("toPositiveIntegerId rejects zero, negatives, fractions, and malformed strings", () => {
  assert.equal(toPositiveIntegerId(0), undefined);
  assert.equal(toPositiveIntegerId(-1), undefined);
  assert.equal(toPositiveIntegerId(1.5), undefined);
  assert.equal(toPositiveIntegerId("  "), undefined);
  assert.equal(toPositiveIntegerId("7.2"), undefined);
  assert.equal(toPositiveIntegerId("abc"), undefined);
  assert.equal(toPositiveIntegerId(Number.MAX_SAFE_INTEGER + 1), undefined);
  assert.equal(toPositiveIntegerId(BigInt(Number.MAX_SAFE_INTEGER) + 1n), undefined);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  shouldPrimeCsrfForEndpoint,
} = require("../../.unit-dist/services/api/csrfPolicy.js");

test("skips CSRF priming for anonymous login and recovery writes", () => {
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/login"), false);
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/signup"), false);
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/2fa/verify-login"), false);
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/forgot-password/request"), false);
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/forgot-password/verify"), false);
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/forgot-password/confirm"), false);
});

test("keeps CSRF priming enabled for authenticated writes", () => {
  assert.equal(shouldPrimeCsrfForEndpoint("/auth/refresh"), true);
  assert.equal(shouldPrimeCsrfForEndpoint("/posts"), true);
  assert.equal(shouldPrimeCsrfForEndpoint(undefined), true);
});

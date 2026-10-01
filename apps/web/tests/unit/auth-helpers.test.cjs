const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeSignupConstraintMessage,
} = require("../../.unit-dist/services/api/signupErrorMessages.js");
const {
  extractErrorMessage,
} = require("../../.unit-dist/features/auth/pages/loginAuthHelpers.js");

test("normalizeSignupConstraintMessage keeps backend duplicate email message for signup", () => {
  const message = normalizeSignupConstraintMessage(
    "An account with this email address already exists. Please use a different email or try logging in.",
  );

  assert.equal(
    message,
    "An account with this email address already exists. Please use a different email or try logging in.",
  );
});

test("normalizeSignupConstraintMessage converts raw duplicate phone errors into a friendly signup message", () => {
  const message = normalizeSignupConstraintMessage(
    "Violation of UNIQUE KEY constraint 'UQ_Users_Phone'. Duplicate key value.",
  );

  assert.equal(
    message,
    "An account with this phone number already exists. Please use a different phone number or try logging in.",
  );
});

test("extractErrorMessage keeps inactive account login messages", () => {
  const message = extractErrorMessage(
    {
      success: false,
      message: "User account is banned or inactive.",
      error: {
        code: "LOGIN_FAILED",
        message: "User account is banned or inactive.",
      },
    },
    "Invalid email, phone number, or password.",
    "Backend unavailable.",
  );

  assert.equal(message, "User account is banned or inactive.");
});

test("extractErrorMessage keeps invalid login attempts generic", () => {
  const message = extractErrorMessage(
    {
      success: false,
      message: "Invalid email/phone or password.",
      error: {
        code: "LOGIN_FAILED",
        message: "Invalid email/phone or password.",
      },
    },
    "Invalid email, phone number, or password.",
    "Backend unavailable.",
  );

  assert.equal(message, "Invalid email, phone number, or password.");
});

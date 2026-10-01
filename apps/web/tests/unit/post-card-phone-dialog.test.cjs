const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolvePhoneDialogCopy,
} = require("../../.unit-dist/features/marketplace/components/postCardPhoneDialog.js");

test("resolvePhoneDialogCopy returns callable state when phone is ready", () => {
  const copy = resolvePhoneDialogCopy("en", "0799988776", "ready");

  assert.equal(copy.canCall, true);
  assert.equal(copy.displayNumber, "0799988776");
  assert.equal(copy.description, "Use the button below to call the seller");
});

test("resolvePhoneDialogCopy returns unavailable state when seller has no phone", () => {
  const copy = resolvePhoneDialogCopy("en", "", "unavailable");

  assert.equal(copy.canCall, false);
  assert.equal(copy.displayNumber, "Unavailable");
  assert.equal(
    copy.description,
    "Phone number is not available for this seller",
  );
});

test("resolvePhoneDialogCopy returns retryable error message on lookup failure", () => {
  const copy = resolvePhoneDialogCopy("en", "", "error");

  assert.equal(copy.canCall, false);
  assert.equal(copy.displayNumber, "Unavailable right now");
  assert.equal(
    copy.description,
    "We couldn't load the phone number right now. Please try again.",
  );
});

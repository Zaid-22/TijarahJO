const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getReportActionFailureOutcome,
} = require("../../.unit-dist/features/admin/reportActionOutcome.js");

test("partial report actions close and refresh before the primary action can repeat", () => {
  assert.deepEqual(
    getReportActionFailureOutcome({
      primaryActionSucceeded: true,
      primaryFailureMessage: "Failed to block post",
      resolutionFailureMessage:
        "Post blocked, but the report could not be resolved",
    }),
    {
      message: "Post blocked, but the report could not be resolved",
      shouldCloseDialog: true,
      shouldRefreshReports: true,
    },
  );
});

test("failed primary report actions remain retryable without a misleading refresh", () => {
  assert.deepEqual(
    getReportActionFailureOutcome({
      primaryActionSucceeded: false,
      primaryFailureMessage: "Failed to delete comment",
      resolutionFailureMessage:
        "Comment deleted, but the report could not be resolved",
    }),
    {
      message: "Failed to delete comment",
      shouldCloseDialog: false,
      shouldRefreshReports: false,
    },
  );
});

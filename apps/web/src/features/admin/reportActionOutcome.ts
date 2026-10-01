export interface ReportActionFailureOutcome {
  message: string;
  shouldCloseDialog: boolean;
  shouldRefreshReports: boolean;
}

export function getReportActionFailureOutcome({
  primaryActionSucceeded,
  primaryFailureMessage,
  resolutionFailureMessage,
}: {
  primaryActionSucceeded: boolean;
  primaryFailureMessage: string;
  resolutionFailureMessage: string;
}): ReportActionFailureOutcome {
  return primaryActionSucceeded
    ? {
        message: resolutionFailureMessage,
        shouldCloseDialog: true,
        shouldRefreshReports: true,
      }
    : {
        message: primaryFailureMessage,
        shouldCloseDialog: false,
        shouldRefreshReports: false,
      };
}

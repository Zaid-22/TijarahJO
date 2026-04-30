import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type SubmitReportPayload = {
  reportType: "LISTING" | "USER" | "REVIEW" | "COMMENT";
  targetId: number | string;
  reason: string;
  description?: string;
};

type SubmitReportResult = {
  success: boolean;
  message?: string;
};

function resolveReportSubmissionError(
  errorCode: string | undefined,
  errorMessage: string | undefined,
): string {
  const normalizedMessage = (errorMessage || "").trim();

  if (errorCode === "HTTP_404" && normalizedMessage === "Not Found") {
    return "Reporting is not available on the current backend yet. Restart the backend on the latest code and try again.";
  }

  if (normalizedMessage.length > 0) {
    return normalizedMessage;
  }

  return "Failed to submit report";
}

export const reportsApi = {
  submitReport: async (
    payload: SubmitReportPayload,
  ): Promise<SubmitReportResult> => {
    const normalizedTargetId = toPositiveIntegerId(payload.targetId);
    if (!normalizedTargetId) {
      return {
        success: false,
        message: "Invalid report target",
      };
    }

    const normalizedReason = payload.reason.trim().toUpperCase();
    if (!normalizedReason) {
      return {
        success: false,
        message: "Report reason is required",
      };
    }

    const response = await apiRequest<unknown>("/reports", {
      method: "POST",
      body: JSON.stringify({
        ReportType: payload.reportType,
        TargetID: normalizedTargetId,
        Reason: normalizedReason,
        Description: payload.description?.trim() || undefined,
      }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      message: resolveReportSubmissionError(
        response.error?.code,
        response.error?.message,
      ),
    };
  },
};

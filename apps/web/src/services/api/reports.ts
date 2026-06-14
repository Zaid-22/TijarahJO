import { toPositiveIntegerId } from "../../utils/idValidation";
import { apiRequest } from "./client";

type SubmitReportPayload = {
  reportType: "LISTING" | "USER" | "REVIEW" | "COMMENT";
  targetId: number | string;
  reason: string;
  description?: string;
  /** Optional evidence image file to attach to the report. */
  image?: File | null;
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

    // Use FormData so we can include the optional evidence image.
    const formData = new FormData();
    formData.append("ReportType", payload.reportType);
    formData.append("TargetID", String(normalizedTargetId));
    formData.append("Reason", normalizedReason);
    if (payload.description?.trim()) {
      formData.append("Description", payload.description.trim());
    }
    if (payload.image) {
      formData.append("Image", payload.image, payload.image.name);
    }

    const response = await apiRequest<unknown>("/reports", {
      method: "POST",
      body: formData,
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

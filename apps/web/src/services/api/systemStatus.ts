import { ApiResponse } from "../../types/api";

type PublicSystemStatusDto = {
  MaintenanceMode?: boolean;
  MaintenanceModeUpdatedAt?: string | null;
  MaintenanceReason?: string | null;
  MaintenanceExpectedReturn?: string | null;
};

export type PublicSystemStatus = {
  maintenanceMode: boolean;
  serviceUnavailable?: boolean;
  maintenanceModeUpdatedAt?: string | null;
  maintenanceReason?: string | null;
  maintenanceExpectedReturn?: string | null;
};

type ProblemDetailsLike = {
  code?: unknown;
  detail?: unknown;
};

function isMaintenanceProblem(details: unknown): details is ProblemDetailsLike {
  if (!details || typeof details !== "object") {
    return false;
  }

  return String((details as ProblemDetailsLike).code ?? "").trim() === "MAINTENANCE_MODE";
}

export function normalizePublicSystemStatusResponse(
  response: ApiResponse<PublicSystemStatusDto>,
): PublicSystemStatus {
  if (!response.success) {
    if (
      response.error?.code === "HTTP_503" &&
      isMaintenanceProblem(response.error?.details)
    ) {
      return {
        maintenanceMode: true,
        serviceUnavailable: true,
        maintenanceReason:
          typeof response.error.details.detail === "string"
            ? response.error.details.detail
            : null,
      };
    }

    if (response.error?.code === "HTTP_503") {
      return {
        maintenanceMode: false,
        serviceUnavailable: true,
        maintenanceReason:
          typeof response.error?.message === "string"
            ? response.error.message
            : null,
      };
    }

    return {
      maintenanceMode: false,
      serviceUnavailable: false,
    };
  }

  return {
    maintenanceMode: Boolean(response.data?.MaintenanceMode),
    serviceUnavailable: false,
    maintenanceModeUpdatedAt: response.data?.MaintenanceModeUpdatedAt ?? null,
    maintenanceReason: response.data?.MaintenanceReason ?? null,
    maintenanceExpectedReturn:
      response.data?.MaintenanceExpectedReturn ?? null,
  };
}

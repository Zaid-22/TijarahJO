import { apiRequest } from "./client";
import {
  normalizePublicSystemStatusResponse,
  PublicSystemStatus,
} from "./systemStatus";

export type { PublicSystemStatus } from "./systemStatus";

type PublicSystemStatusDto = {
  MaintenanceMode?: boolean;
  MaintenanceModeUpdatedAt?: string | null;
  MaintenanceReason?: string | null;
  MaintenanceExpectedReturn?: string | null;
};

export const systemApi = {
  getPublicStatus: async (): Promise<PublicSystemStatus> => {
    const response = await apiRequest<PublicSystemStatusDto>("/system/status", {
      method: "GET",
      timeoutMs: 4_000,
    });
    return normalizePublicSystemStatusResponse(response);
  },
};

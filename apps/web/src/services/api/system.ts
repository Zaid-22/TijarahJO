import { apiRequest } from "./client";

type PublicSystemStatusDto = {
  MaintenanceMode?: boolean;
  MaintenanceModeUpdatedAt?: string | null;
};

export type PublicSystemStatus = {
  maintenanceMode: boolean;
  maintenanceModeUpdatedAt?: string | null;
};

export const systemApi = {
  getPublicStatus: async (): Promise<PublicSystemStatus> => {
    const response = await apiRequest<PublicSystemStatusDto>("/system/status", {
      method: "GET",
      timeoutMs: 4_000,
    });

    if (!response.success) {
      return {
        maintenanceMode: false,
      };
    }

    return {
      maintenanceMode: Boolean(response.data?.MaintenanceMode),
      maintenanceModeUpdatedAt: response.data?.MaintenanceModeUpdatedAt ?? null,
    };
  },
};

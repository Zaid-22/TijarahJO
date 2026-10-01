import { apiRequest } from "./client";
import { toPositiveIntegerId } from "../../utils/idValidation";

interface RolePayload {
  RoleName: string;
  CreatedAt?: string;
  IsDeleted?: boolean;
}

type RawRole = {
  RoleID?: unknown;
  roleID?: unknown;
  id?: unknown;
  RoleName?: unknown;
  roleName?: unknown;
  name?: unknown;
  CreatedAt?: unknown;
  createdAt?: unknown;
  IsDeleted?: unknown;
  isDeleted?: unknown;
  message?: unknown;
  Message?: unknown;
};

export type NormalizedRole = {
  RoleID: number;
  RoleName: string;
  CreatedAt: string;
  IsDeleted: boolean;
};

function normalizeRoleRecord(role: RawRole | null | undefined): NormalizedRole | null {
  if (!role || typeof role !== "object") {
    return null;
  }

  const roleId = toPositiveIntegerId(role.RoleID ?? role.roleID ?? role.id);
  if (!roleId) {
    return null;
  }

  const roleName = String(role.RoleName ?? role.roleName ?? role.name ?? "").trim();
  if (!roleName) {
    return null;
  }

  const createdAtRaw = role.CreatedAt ?? role.createdAt;
  const parsedCreatedAt =
    typeof createdAtRaw === "string" || createdAtRaw instanceof Date
      ? new Date(createdAtRaw)
      : null;

  return {
    RoleID: roleId,
    RoleName: roleName,
    CreatedAt:
      parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
        ? parsedCreatedAt.toISOString()
        : new Date().toISOString(),
    IsDeleted: Boolean(role.IsDeleted ?? role.isDeleted ?? false),
  };
}

function extractMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = (data as RawRole).message ?? (data as RawRole).Message;
  const message = typeof candidate === "string" ? candidate.trim() : "";
  return message || fallback;
}

export const rolesApi = {
  getRoles: async (): Promise<NormalizedRole[]> => {
    const response = await apiRequest<RawRole[]>("/roles", { method: "GET" });
    if (!response.success || !Array.isArray(response.data)) {
      return [];
    }

    return response.data
      .map((role) => normalizeRoleRecord(role))
      .filter((role): role is NormalizedRole => role !== null);
  },

  getRole: async (id: string): Promise<NormalizedRole | null> => {
    const normalizedRoleId = toPositiveIntegerId(id);
    if (!normalizedRoleId) {
      return null;
    }

    const response = await apiRequest<RawRole>(`/roles/${normalizedRoleId}`, {
      method: "GET",
    });
    if (!response.success || !response.data) {
      return null;
    }

    return normalizeRoleRecord(response.data);
  },

  createRole: async (
    payload: RolePayload,
  ): Promise<{ success: boolean; role?: NormalizedRole; message?: string }> => {
    const roleName = payload.RoleName.trim();
    if (!roleName) {
      return {
        success: false,
        message: "Role name is required",
      };
    }

    const response = await apiRequest<RawRole>("/roles", {
      method: "POST",
      body: JSON.stringify({
        RoleName: roleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success && response.data) {
      const normalizedRole = normalizeRoleRecord(response.data);
      if (normalizedRole) {
        return { success: true, role: normalizedRole };
      }

      return {
        success: false,
        message: "Role created but response payload was invalid",
      };
    }

    const errorMessage = !response.success
      ? response.error?.message || "Failed to create role"
      : "Failed to create role";

    return {
      success: false,
      message: errorMessage,
    };
  },

  updateRole: async (
    id: string,
    payload: RolePayload,
  ): Promise<{ success: boolean; role?: NormalizedRole; message?: string }> => {
    const normalizedRoleId = toPositiveIntegerId(id);
    if (!normalizedRoleId) {
      return {
        success: false,
        message: "Invalid role ID",
      };
    }

    const roleName = payload.RoleName.trim();
    if (!roleName) {
      return {
        success: false,
        message: "Role name is required",
      };
    }

    const response = await apiRequest<RawRole>(`/roles/${normalizedRoleId}`, {
      method: "PUT",
      body: JSON.stringify({
        RoleID: normalizedRoleId,
        RoleName: roleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success && response.data) {
      const normalizedRole = normalizeRoleRecord(response.data);
      if (normalizedRole) {
        return { success: true, role: normalizedRole };
      }

      return {
        success: false,
        message: "Role updated but response payload was invalid",
      };
    }

    const errorMessage = !response.success
      ? response.error?.message || "Failed to update role"
      : "Failed to update role";

    return {
      success: false,
      message: errorMessage,
    };
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedRoleId = toPositiveIntegerId(id);
    if (!normalizedRoleId) {
      return {
        success: false,
        message: "Invalid role ID",
      };
    }

    const response = await apiRequest<RawRole>(`/roles/${normalizedRoleId}`, {
      method: "DELETE",
    });

    if (response.success) {
      return {
        success: true,
        message: extractMessage(response.data, "Role deleted successfully"),
      };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete role",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const normalizedRoleId = toPositiveIntegerId(id);
    if (!normalizedRoleId) {
      return false;
    }

    const response = await apiRequest<boolean>(`/roles/Exists/${normalizedRoleId}`, {
      method: "GET",
    });

    return response.success ? Boolean(response.data) : false;
  },
};

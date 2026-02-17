import { apiRequest } from "./client";

interface RolePayload {
  RoleName: string;
  CreatedAt?: string;
  IsDeleted?: boolean;
}

export const rolesApi = {
  getRoles: async (): Promise<any[]> => {
    const response = await apiRequest<any[]>("/TbRoles/All", { method: "GET" });
    return response.success && Array.isArray(response.data) ? response.data : [];
  },

  getRole: async (id: string): Promise<any | null> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, { method: "GET" });
    return response.success ? response.data : null;
  },

  createRole: async (
    payload: RolePayload,
  ): Promise<{ success: boolean; role?: any; message?: string }> => {
    const response = await apiRequest<any>("/TbRoles", {
      method: "POST",
      body: JSON.stringify({
        RoleName: payload.RoleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      return { success: true, role: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to create role",
    };
  },

  updateRole: async (
    id: string,
    payload: RolePayload,
  ): Promise<{ success: boolean; role?: any; message?: string }> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        RoleID: Number(id),
        RoleName: payload.RoleName,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        IsDeleted: payload.IsDeleted ?? false,
      }),
    });

    if (response.success) {
      return { success: true, role: response.data };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to update role",
    };
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiRequest<any>(`/TbRoles/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      return {
        success: true,
        message: (response.data as any)?.message || "Role deleted successfully",
      };
    }

    return {
      success: false,
      message: response.error?.message || "Failed to delete role",
    };
  },

  exists: async (id: string): Promise<boolean> => {
    const response = await apiRequest<boolean>(`/TbRoles/Exists/${id}`, {
      method: "GET",
    });

    return response.success ? Boolean(response.data) : false;
  },
};

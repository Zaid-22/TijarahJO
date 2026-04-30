import { User } from "../types";
import { readStringArray, toBoolean } from "../services/api/normalizers";

type BackendUserPayload = {
  Id?: string | number;
  id?: string | number;
  UserID?: string | number;
  userID?: string | number;
  Email?: string;
  email?: string;
  FirstName?: string;
  firstName?: string;
  LastName?: string;
  lastName?: string;
  Name?: string;
  name?: string;
  Avatar?: string;
  avatar?: string;
  RoleID?: string | number;
  roleID?: string | number;
  Role?: string | number;
  role?: string | number;
  RoleName?: string;
  roleName?: string;
  HasAdminAccess?: boolean;
  hasAdminAccess?: boolean;
  AdminPermissions?: string[];
  adminPermissions?: string[];
  Permissions?: string[];
  permissions?: string[];
};

type UserFallback = Partial<User> & {
  email: string;
};

function asBackendUser(value: unknown): BackendUserPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as BackendUserPayload;
}

function resolvePermissions(backendUser: BackendUserPayload): string[] {
  return readStringArray(
    backendUser.AdminPermissions ??
      backendUser.adminPermissions ??
      backendUser.Permissions ??
      backendUser.permissions,
  );
}

export function resolveHasAdminAccessFromPayload(
  backendUser: BackendUserPayload | null | undefined,
): boolean {
  if (!backendUser) {
    return false;
  }

  const explicitAdminAccess = toBoolean(
    backendUser.HasAdminAccess ?? backendUser.hasAdminAccess,
    false,
  );
  if (explicitAdminAccess) {
    return true;
  }

  const permissions = resolvePermissions(backendUser);
  if (permissions.length > 0) {
    return true;
  }

  const roleValue =
    backendUser.RoleID ??
    backendUser.roleID ??
    backendUser.Role ??
    backendUser.role ??
    backendUser.RoleName ??
    backendUser.roleName;

  return (
    roleValue === 1 ||
    roleValue === "1" ||
    (typeof roleValue === "string" &&
      roleValue.trim().toLowerCase() === "admin")
  );
}

function mapRole(roleId: unknown, hasAdminAccess: boolean): "admin" | "user" {
  if (hasAdminAccess) {
    return "admin";
  }

  if (
    roleId === 1 ||
    roleId === "1" ||
    (typeof roleId === "string" && roleId.toLowerCase() === "admin")
  ) {
    return "admin";
  }

  return "user";
}

function toUserFromBackend(
  backendUser: BackendUserPayload,
  fallback: Partial<User> = {},
): User {
  const firstName =
    backendUser.FirstName || backendUser.firstName || fallback.firstName || "";
  const lastName =
    backendUser.LastName || backendUser.lastName || fallback.lastName || "";
  const fullName =
    backendUser.Name ||
    backendUser.name ||
    `${firstName} ${lastName}`.trim() ||
    fallback.name ||
    backendUser.Email ||
    backendUser.email ||
    fallback.email ||
    "";

  const hasAdminAccess = resolveHasAdminAccessFromPayload(backendUser);
  const role = mapRole(undefined, hasAdminAccess);
  const permissions = resolvePermissions(backendUser);
  const roleName =
    backendUser.RoleName ??
    backendUser.roleName ??
    (typeof fallback.role === "string" ? fallback.role : undefined);

  return {
    id: String(
      backendUser.Id ||
        backendUser.id ||
        backendUser.UserID ||
        backendUser.userID ||
        fallback.id ||
        "",
    ),
    email: backendUser.Email || backendUser.email || fallback.email || "",
    firstName,
    lastName,
    name: fullName,
    avatar: backendUser.Avatar || backendUser.avatar || fallback.avatar,
    role,
    roleName: typeof roleName === "string" ? roleName : undefined,
    hasAdminAccess,
    permissions,
  };
}

function toFallbackUser(fallback: UserFallback): User {
  const email = fallback.email || "";
  const firstName = fallback.firstName || "";
  const lastName = fallback.lastName || "";
  const name = fallback.name || `${firstName} ${lastName}`.trim() || email;

  return {
    id: String(fallback.id || ""),
    email,
    firstName,
    lastName,
    name,
    avatar: fallback.avatar,
    role: fallback.role === "admin" ? "admin" : "user",
  };
}

export function resolveUserFromAuthPayload(
  payload: unknown,
  fallback: UserFallback,
): User {
  const safeFallback = toFallbackUser(fallback);
  const backendUser = asBackendUser(payload);
           
  if (!backendUser) {
    return safeFallback;
  }

  return toUserFromBackend(backendUser, safeFallback);
}

export function userHasAdminAccess(user: Pick<User, "role" | "hasAdminAccess" | "permissions"> | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return user.role === "admin" || user.hasAdminAccess === true || (user.permissions?.length ?? 0) > 0;
}

export function userHasAdminPermission(
  user: Pick<User, "role" | "hasAdminAccess" | "permissions"> | null | undefined,
  permissionKey: string,
): boolean {
  if (!permissionKey.trim()) {
    return false;
  }

  if (!userHasAdminAccess(user)) {
    return false;
  }

  if (!user?.permissions || user.permissions.length === 0) {
    return user?.role === "admin";
  }

  return user.permissions.includes(permissionKey);
}

export const isAuthRejectionMessage = (message: string | undefined): boolean => {
  const normalized = message?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized === "unauthorized" ||
    normalized === "forbidden" ||
    normalized.includes("401") ||
    normalized.includes("403")
  );
};

export const normalizeAuthRejectionMessage = (
  error: { code?: string; message?: string } | undefined,
  fallback: string,
): string => {
  if (
    error?.code === "HTTP_401" ||
    error?.code === "HTTP_403" ||
    isAuthRejectionMessage(error?.message)
  ) {
    return fallback;
  }

  const trimmed = error?.message?.trim();
  return trimmed ? trimmed : fallback;
};

export const shouldClearTokenForAuthError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("token expired") ||
    normalized.includes("jwt expired")
  );
};

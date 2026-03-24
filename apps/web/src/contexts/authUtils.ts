import { User } from "../types";

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

function mapRole(roleId: unknown): "admin" | "user" {
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

  const role = mapRole(
    backendUser.RoleID ??
      backendUser.roleID ??
      backendUser.Role ??
      backendUser.role ??
      backendUser.RoleName ??
      backendUser.roleName ??
      fallback.role,
  );

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

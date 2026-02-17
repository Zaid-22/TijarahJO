import { User } from "../types";

export type BackendUserPayload = {
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
};

export function asBackendUser(value: unknown): BackendUserPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as BackendUserPayload;
}

export function mapRole(roleId: unknown): "admin" | "user" {
  if (
    roleId === 1 ||
    roleId === "1" ||
    (typeof roleId === "string" && roleId.toLowerCase() === "admin")
  ) {
    return "admin";
  }

  return "user";
}

export function toUserFromBackend(
  backendUser: BackendUserPayload,
  fallback: Partial<User> = {},
): User {
  const firstName = backendUser.FirstName || backendUser.firstName || fallback.firstName || "";
  const lastName = backendUser.LastName || backendUser.lastName || fallback.lastName || "";
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
    email:
      backendUser.Email ||
      backendUser.email ||
      fallback.email ||
      "",
    firstName,
    lastName,
    name: fullName,
    avatar: backendUser.Avatar || backendUser.avatar || fallback.avatar,
    role,
  };
}

export const shouldClearTokenForAuthError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("401") ||
    message.includes("Unauthorized")
  );
};

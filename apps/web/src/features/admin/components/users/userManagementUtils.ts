import type { NormalizedRole } from "../../../../services/api/roles";
import { formatCompactDate } from "../../../../shared/lib/dateTime";

export function formatJoinedDate(dateValue?: string): string {
  if (!dateValue) {
    return "N/A";
  }
  return formatCompactDate(dateValue) || dateValue;
}

export function getAssignableRoles(roles: NormalizedRole[]): NormalizedRole[] {
  return roles.filter((role) => !role.IsDeleted);
}

export function getDefaultCreateRoleId(roles: NormalizedRole[]): string {
  const assignableRoles = getAssignableRoles(roles);
  if (assignableRoles.length === 0) {
    return "";
  }

  const preferredRole =
    assignableRoles.find(
      (role) =>
        role.RoleID === 2 || role.RoleName.trim().toLowerCase() === "user",
    ) ??
    assignableRoles.find(
      (role) => role.RoleName.trim().toLowerCase() !== "admin",
    ) ??
    assignableRoles[0];

  return String(preferredRole.RoleID);
}

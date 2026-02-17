export function toIsoStringOrNow(value: unknown): string {
  if (value !== null && value !== undefined && value !== "") {
    const parsedDate = new Date(value as string | number | Date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date().toISOString();
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    return null;
  }

  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  try {
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAdminRoleClaimValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => isAdminRoleClaimValue(entry));
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "admin";
  }

  return false;
}

export function isCurrentSessionAdmin(): boolean {
  const token = localStorage.getItem("tijarahjo_token");
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  const roleClaim =
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    payload.role ??
    payload.roles ??
    payload.RoleID ??
    payload.roleID;

  return isAdminRoleClaimValue(roleClaim);
}

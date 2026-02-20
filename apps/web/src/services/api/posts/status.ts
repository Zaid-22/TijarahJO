import { ProductStatus } from "./types";

const POST_STATUS_ACTIVE = 0;
const POST_STATUS_BLOCKED = 1;
const POST_STATUS_INACTIVE = 2;
const POST_STATUS_SOLD = 3;

export function normalizeProductStatus(rawStatus: unknown): ProductStatus {
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toUpperCase();
    if (normalized === "SOLD") {
      return "SOLD";
    }
    if (
      normalized === "DELETED" ||
      normalized === "BLOCKED" ||
      normalized === "INACTIVE"
    ) {
      return "DELETED";
    }
    return "ACTIVE";
  }

  const numericStatus = Number(rawStatus);
  if (numericStatus === POST_STATUS_SOLD) {
    return "SOLD";
  }
  if (
    numericStatus === POST_STATUS_BLOCKED ||
    numericStatus === POST_STATUS_INACTIVE
  ) {
    return "DELETED";
  }
  return "ACTIVE";
}

export function toStatusNumber(
  value: unknown,
  fallbackStatus = POST_STATUS_ACTIVE,
): number {
  const numericStatus = Number(value);
  if (!Number.isFinite(numericStatus)) {
    return fallbackStatus;
  }

  return Math.trunc(numericStatus);
}

export function resolveStatusValue(
  status: string | undefined,
  fallbackStatus: number,
): number {
  if (typeof status !== "string") {
    return fallbackStatus;
  }

  switch (status.trim().toUpperCase()) {
    case "ACTIVE":
      return POST_STATUS_ACTIVE;
    case "BLOCKED":
      return POST_STATUS_BLOCKED;
    case "INACTIVE":
    case "DELETED":
      return POST_STATUS_INACTIVE;
    case "SOLD":
      return POST_STATUS_SOLD;
    default:
      return fallbackStatus;
  }
}

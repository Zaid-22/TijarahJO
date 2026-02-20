export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }
  return null;
}

export function toRecord(value: unknown): UnknownRecord {
  return asRecord(value) ?? {};
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function toIntegerOrDefault(
  value: unknown,
  fallback: number,
  minimumValue: number = Number.MIN_SAFE_INTEGER,
): number {
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < minimumValue
  ) {
    return fallback;
  }
  return parsed;
}

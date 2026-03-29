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

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

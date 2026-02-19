/**
 * Parse a backend numeric identifier into a strict positive integer.
 * Returns undefined when the value is missing, malformed, or non-positive.
 */
export function toPositiveIntegerId(value: unknown): number | undefined {
  if (typeof value === "number") {
    if (Number.isSafeInteger(value) && value > 0) {
      return value;
    }
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
    return undefined;
  }

  if (typeof value === "bigint") {
    if (value > 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return Number(value);
    }
    return undefined;
  }

  return undefined;
}

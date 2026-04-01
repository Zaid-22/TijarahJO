function normalizeIsoDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const hasExplicitTimezone =
    trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed);
  const looksLikeIsoTimestamp = /^\d{4}-\d{2}-\d{2}T/.test(trimmed);

  if (looksLikeIsoTimestamp && !hasExplicitTimezone) {
    return `${trimmed}Z`;
  }

  return trimmed;
}

export function toIsoStringOrNow(value: unknown): string {
  if (value !== null && value !== undefined && value !== "") {
    const normalizedValue =
      typeof value === "string" ? normalizeIsoDateInput(value) : value;
    const parsedDate = new Date(normalizedValue as string | number | Date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date().toISOString();
}

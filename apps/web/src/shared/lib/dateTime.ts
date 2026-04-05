function resolveLocale(locale?: string): string {
  const trimmedLocale = locale?.trim();
  if (trimmedLocale) {
    return trimmedLocale;
  }

  if (typeof navigator !== "undefined" && navigator.language.trim()) {
    return navigator.language;
  }

  return "en-US";
}

function isArabicLocale(locale?: string): boolean {
  return resolveLocale(locale).toLowerCase().startsWith("ar");
}

function toValidDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCompactTime(value: string, locale?: string): string {
  const parsed = toValidDate(value);
  if (!parsed) {
    return "";
  }

  const resolvedLocale = resolveLocale(locale);

  return parsed.toLocaleTimeString(resolvedLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !isArabicLocale(resolvedLocale),
  });
}

export function formatCompactDate(value: string, locale?: string): string {
  const parsed = toValidDate(value);
  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString(resolveLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCompactDateTime(value: string, locale?: string): string {
  const parsed = toValidDate(value);
  if (!parsed) {
    return "";
  }

  const resolvedLocale = resolveLocale(locale);

  return parsed.toLocaleString(resolvedLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !isArabicLocale(resolvedLocale),
  });
}

export function formatRelativeTime(value: string, locale?: string): string {
  const parsed = toValidDate(value);
  if (!parsed) {
    return "";
  }

  const diffInSeconds = Math.round((parsed.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(resolveLocale(locale), {
    numeric: "auto",
  });
  const divisions = [
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
  ] as const;

  for (const division of divisions) {
    if (Math.abs(diffInSeconds) >= division.seconds || division.unit === "minute") {
      return formatter.format(
        Math.round(diffInSeconds / division.seconds),
        division.unit,
      );
    }
  }

  return formatter.format(0, "second");
}

export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const needle = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(needle)) {
      const rawValue = part.slice(needle.length);
      return decodeURIComponent(rawValue);
    }
  }

  return null;
}


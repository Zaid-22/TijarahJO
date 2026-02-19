export function toIsoStringOrNow(value: unknown): string {
  if (value !== null && value !== undefined && value !== "") {
    const parsedDate = new Date(value as string | number | Date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date().toISOString();
}

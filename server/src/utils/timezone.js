export function isValidIanaTimezone(timezone) {
  if (typeof timezone !== "string" || !timezone.trim()) {
    return false;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone.trim() });
    return true;
  } catch {
    return false;
  }
}

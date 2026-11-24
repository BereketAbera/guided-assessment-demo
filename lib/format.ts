/** Dates are formatted in UTC on the server so a page renders the same everywhere. */
export function longDate(value: number | string): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value,
  );
}

export function shortDateTime(ms: number): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(ms) + " UTC"
  );
}

export function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function number(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

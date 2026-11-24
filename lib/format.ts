import { settings } from "@/lib/settings";

/**
 * Dates are formatted on the server in the product's own time zone (set in
 * the settings file), so a report finished in the evening carries that day's
 * date and a page renders the same everywhere.
 */
export const PRODUCT_TIME_ZONE: string = settings.assessment.timeZone;

/** The calendar day (YYYY-MM-DD) a moment falls on in the given time zone. */
export function dayInZone(ms: number, timeZone: string = PRODUCT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(ms);
}

/** "November 24, 2026". A stored calendar day is shown as it is; a moment is placed in the product's time zone. */
export function longDate(value: number | string, timeZone: string = PRODUCT_TIME_ZONE): string {
  const day = typeof value === "string" ? value : dayInZone(value, timeZone);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );
}

/** "Nov 24, 5:52 AM EST": the owner's times carry the zone they are shown in. */
export function shortDateTime(ms: number, timeZone: string = PRODUCT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(ms);
}

export function shortDate(ms: number, timeZone: string = PRODUCT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }).format(ms);
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

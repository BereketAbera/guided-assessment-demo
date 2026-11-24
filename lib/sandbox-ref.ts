/**
 * Each visitor gets a private space ("sandbox"), named by an unguessable
 * reference kept in an http-only cookie. The reference starts with the day it
 * was made, so clean-up can remove old spaces without opening them.
 * This file has no server-only imports, so the middleware can use it.
 */
export const RETENTION_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

function dayStamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, "");
}

export function newSandboxRef(now: number): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${dayStamp(now)}-${hex}`;
}

export function isSandboxRef(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{8}-[0-9a-f]{32}$/.test(value);
}

function refDay(ref: string): number {
  const d = ref.slice(0, 8);
  return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(4, 6)) - 1, Number(d.slice(6, 8)));
}

/** A sandbox lives for RETENTION_DAYS from the day it was created. */
export function isLiveRef(ref: string, now: number): boolean {
  const age = now - refDay(ref);
  return age >= -DAY && age < RETENTION_DAYS * DAY;
}

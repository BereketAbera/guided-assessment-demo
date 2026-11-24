import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import type { MachineConfig } from "@/lib/assessment/machine";
import { estimateTokens } from "@/lib/assessment/usage";
import { isLiveRef, isSandboxRef, newSandboxRef, RETENTION_DAYS } from "@/lib/sandbox-ref";
import { settings } from "@/lib/settings";
import { Repo, type Located } from "./repo";
import { getStore } from "./store";
import { decodePointer, isOwnerOf, type SessionPointer } from "./tokens";

export { encodeOwner, encodePointer, OWNER_HOURS, type SessionPointer } from "./tokens";

export const SANDBOX_COOKIE = "ga_sb";
export const SESSION_COOKIE = "ga_sess";
export const ADMIN_COOKIE = "ga_admin";
/** Readable by the page, and holds nothing private: it only says this visitor has made something, so the inbox is worth fetching. */
export const ACTIVE_COOKIE = "ga_active";

let promptText: string | null = null;
/** The prompt is a plain file in /settings, read once per server start. */
export function guidePrompt(): string {
  if (promptText === null) {
    promptText = readFileSync(path.join(process.cwd(), "settings", settings.promptFile), "utf8");
  }
  return promptText;
}

export function machineConfig(): MachineConfig {
  return {
    timeLimitDays: settings.assessment.timeLimitDays,
    reopenDays: settings.assessment.reopenDays,
    promptTokens: estimateTokens(guidePrompt()),
    stages: settings.reportJob.stages,
    parts: settings.parts,
  };
}

let shared: Repo | null = null;
export function repo(): Repo {
  if (!shared) shared = new Repo(getStore(), machineConfig());
  return shared;
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.GA_INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const SANDBOX_MAX_AGE = RETENTION_DAYS * 24 * 60 * 60;
export const SESSION_MAX_AGE = 12 * 60 * 60;

/** This visitor's private space. The middleware sets the cookie; route handlers may also mint one. */
export async function sandboxRef(): Promise<string> {
  const jar = await cookies();
  const value = jar.get(SANDBOX_COOKIE)?.value;
  if (isSandboxRef(value) && isLiveRef(value, Date.now())) return value;
  const fresh = newSandboxRef(Date.now());
  try {
    jar.set(SANDBOX_COOKIE, fresh, cookieOptions(SANDBOX_MAX_AGE));
  } catch {
    // Server components cannot set cookies; the middleware has already done it for the next request.
  }
  return fresh;
}

export async function sessionPointer(): Promise<SessionPointer | null> {
  return decodePointer((await cookies()).get(SESSION_COOKIE)?.value);
}

/** The session this browser has open, found from its http-only cookie. */
export async function currentSession(): Promise<Located | null> {
  const pointer = await sessionPointer();
  if (!pointer) return null;
  return repo().get(pointer.ref, pointer.sessionId);
}

/** True only with the sealed cookie the owner sign-in route sets, for this visitor's own space, before it lapses. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isOwnerOf(jar.get(ADMIN_COOKIE)?.value, jar.get(SANDBOX_COOKIE)?.value, Date.now());
}

/** Marks this browser as having a sample space, so the demo inbox knows to load. */
export async function markActive(): Promise<void> {
  (await cookies()).set(ACTIVE_COOKIE, "1", { ...cookieOptions(SANDBOX_MAX_AGE), httpOnly: false });
}

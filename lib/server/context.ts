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

export const SANDBOX_COOKIE = "ga_sb";
export const SESSION_COOKIE = "ga_sess";
export const ADMIN_COOKIE = "ga_admin";

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

export type SessionPointer = { ref: string; sessionId: string };

export function encodePointer(pointer: SessionPointer): string {
  return `${pointer.ref}~${pointer.sessionId}`;
}

export async function sessionPointer(): Promise<SessionPointer | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [ref, sessionId] = value.split("~");
  if (!isSandboxRef(ref) || !sessionId || !/^S-\d{1,8}$/.test(sessionId)) return null;
  return { ref, sessionId };
}

/** The session this browser has open, found from its http-only cookie. */
export async function currentSession(): Promise<Located | null> {
  const pointer = await sessionPointer();
  if (!pointer) return null;
  return repo().get(pointer.ref, pointer.sessionId);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const ref = jar.get(SANDBOX_COOKIE)?.value;
  return isSandboxRef(ref) && jar.get(ADMIN_COOKIE)?.value === ref;
}

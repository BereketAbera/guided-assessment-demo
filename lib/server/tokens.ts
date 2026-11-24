import "server-only";
import { isSandboxRef } from "@/lib/sandbox-ref";
import { seal, unseal } from "./crypto";

/**
 * The values kept in the session and owner cookies. Both are sealed with the
 * server's key (AES-256-GCM), so a browser can hold one but cannot read it,
 * change it or make its own. A second device that enters a code is handed a
 * sealed pointer to that one session and learns nothing else about the space
 * the code came from.
 */
export type SessionPointer = { ref: string; sessionId: string };

type SealedPointer = { k: "sess"; ref: string; sessionId: string };
type SealedOwner = { k: "owner"; ref: string; exp: number };

export const OWNER_HOURS = 4;

function open<T>(value: string | undefined): Partial<T> | null {
  if (!value) return null;
  try {
    const found = unseal<unknown>(value);
    return found && typeof found === "object" ? (found as Partial<T>) : null;
  } catch {
    // Not sealed with this server's key: a hand-made or altered value.
    return null;
  }
}

export function encodePointer(pointer: SessionPointer): string {
  const value: SealedPointer = { k: "sess", ref: pointer.ref, sessionId: pointer.sessionId };
  return seal(value);
}

export function decodePointer(value: string | undefined): SessionPointer | null {
  const found = open<SealedPointer>(value);
  if (!found || found.k !== "sess") return null;
  if (!isSandboxRef(found.ref) || typeof found.sessionId !== "string" || !/^S-\d{1,8}$/.test(found.sessionId)) return null;
  return { ref: found.ref, sessionId: found.sessionId };
}

/** Made only by the owner sign-in route. Names the one space it opens, and when it stops working. */
export function encodeOwner(ref: string, now: number): string {
  const value: SealedOwner = { k: "owner", ref, exp: now + OWNER_HOURS * 60 * 60 * 1000 };
  return seal(value);
}

export function isOwnerOf(value: string | undefined, ref: string | undefined, now: number): boolean {
  const found = open<SealedOwner>(value);
  if (!found || found.k !== "owner" || typeof found.exp !== "number") return false;
  return isSandboxRef(ref) && found.ref === ref && now < found.exp;
}

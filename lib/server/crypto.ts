import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { usesBlobStore } from "./store";

/**
 * Answers, first names, reports and simulated emails are sealed with
 * AES-256-GCM before they are stored. The key comes from the server's
 * environment (DATA_KEY) and never reaches the browser or the repository.
 * Access codes are stored as a keyed hash, so the stored record cannot be
 * turned back into a code.
 */
type Keys = { seal: Buffer; code: Buffer };
let cached: Keys | null = null;

function secret(): Buffer {
  const hex = process.env.DATA_KEY;
  if (hex && /^[0-9a-f]{64}$/i.test(hex)) return Buffer.from(hex, "hex");
  if (usesBlobStore()) throw new Error("DATA_KEY must be set when the shared store is in use.");
  // Local development and tests only: data lives in memory and is gone on restart.
  return createHash("sha256").update("local-development-only").digest();
}

function keys(): Keys {
  if (!cached) {
    const root = secret();
    cached = {
      seal: Buffer.from(hkdfSync("sha256", root, Buffer.alloc(0), "guided-assessment/seal/v1", 32)),
      code: Buffer.from(hkdfSync("sha256", root, Buffer.alloc(0), "guided-assessment/code/v1", 32)),
    };
  }
  return cached;
}

export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys().seal, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function unseal<T>(sealed: string): T {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || body === undefined) throw new Error("Unreadable sealed value.");
  const decipher = createDecipheriv("aes-256-gcm", keys().seal, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const plain = Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}

/** The lookup key for an access code. One-way: the code cannot be recovered from it. */
export function codeKey(normalizedCode: string): string {
  return createHmac("sha256", keys().code).update(normalizedCode).digest("hex").slice(0, 48);
}

export function randomHex(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function secureBytes(n: number): Uint8Array {
  return randomBytes(n);
}

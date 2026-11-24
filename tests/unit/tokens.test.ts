import { describe, expect, it } from "vitest";
import { newSandboxRef } from "@/lib/sandbox-ref";
import { seal } from "@/lib/server/crypto";
import { decodePointer, encodeOwner, encodePointer, isOwnerOf, OWNER_HOURS } from "@/lib/server/tokens";
import { T0 } from "./fixtures";

const HOUR = 60 * 60 * 1000;

describe("the session cookie", () => {
  const ref = newSandboxRef(T0);

  it("round-trips a pointer without showing where it points", () => {
    const value = encodePointer({ ref, sessionId: "S-1043" });
    expect(value).not.toContain(ref);
    expect(value).not.toContain("S-1043");
    expect(value).toMatch(/^[A-Za-z0-9_.-]+$/);
    expect(decodePointer(value)).toEqual({ ref, sessionId: "S-1043" });
  });

  it("rejects a hand-built pointer, however well it is guessed", () => {
    expect(decodePointer(`${ref}~S-1043`)).toBeNull();
    expect(decodePointer(ref)).toBeNull();
    expect(decodePointer("")).toBeNull();
    expect(decodePointer(undefined)).toBeNull();
    expect(decodePointer("v1.AAAA.BBBB.CCCC")).toBeNull();
  });

  it("rejects a sealed value that has been altered, or that was sealed for another purpose", () => {
    const value = encodePointer({ ref, sessionId: "S-1043" });
    const altered = value.slice(0, -2) + (value.endsWith("A") ? "B" : "A") + value.slice(-1);
    expect(decodePointer(altered)).toBeNull();
    expect(decodePointer(encodeOwner(ref, T0))).toBeNull();
    expect(decodePointer(seal({ k: "sess", ref: "not-a-ref", sessionId: "S-1" }))).toBeNull();
    expect(decodePointer(seal({ k: "sess", ref, sessionId: "../S-1" }))).toBeNull();
  });
});

describe("the owner cookie", () => {
  const ref = newSandboxRef(T0);
  const other = newSandboxRef(T0);

  it("opens the space it was made for, until it lapses", () => {
    const value = encodeOwner(ref, T0);
    expect(isOwnerOf(value, ref, T0)).toBe(true);
    expect(isOwnerOf(value, ref, T0 + OWNER_HOURS * HOUR - 1)).toBe(true);
    expect(isOwnerOf(value, ref, T0 + OWNER_HOURS * HOUR)).toBe(false);
    expect(isOwnerOf(value, other, T0)).toBe(false);
    expect(isOwnerOf(value, undefined, T0)).toBe(false);
  });

  it("cannot be made from a space's reference or from a session cookie", () => {
    // Before this was sealed, the reference itself was the owner cookie.
    expect(isOwnerOf(ref, ref, T0)).toBe(false);
    expect(isOwnerOf(encodePointer({ ref, sessionId: "S-1043" }), ref, T0)).toBe(false);
    expect(isOwnerOf(undefined, ref, T0)).toBe(false);
    expect(isOwnerOf(seal({ k: "owner", ref }), ref, T0)).toBe(false);
  });
});

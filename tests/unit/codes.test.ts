import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, checkCodeFormat, codeHint, formatCode, generateCode, normalizeCode } from "@/lib/codes";

describe("access code format", () => {
  it("accepts lower case, spaces and dashes", () => {
    expect(normalizeCode(" k7qm - 2xhd ")).toBe("K7QM2XHD");
    expect(normalizeCode("k7qm–2xhd")).toBe("K7QM2XHD");
    expect(checkCodeFormat("k7qm 2xhd")).toEqual({ ok: true, code: "K7QM2XHD" });
  });

  it("shows the code grouped as XXXX-XXXX while it is typed", () => {
    expect(formatCode("k7")).toBe("K7");
    expect(formatCode("k7qm")).toBe("K7QM");
    expect(formatCode("k7qm2")).toBe("K7QM-2");
    expect(formatCode("K7QM-2XHD")).toBe("K7QM-2XHD");
    expect(formatCode("k7qm2xhd99")).toBe("K7QM-2XHD");
  });

  it("explains what is wrong with a code", () => {
    expect(checkCodeFormat("   ")).toMatchObject({ ok: false, reason: "empty" });
    expect(checkCodeFormat("K7QM-2X")).toMatchObject({ ok: false, reason: "too_short" });
    expect(checkCodeFormat("K7QM-2XHD-9")).toMatchObject({ ok: false, reason: "too_long" });
    for (const bad of ["K7QM-2XH0", "K7QM-2XH1", "K7QM-2XHO", "K7QM-2XHI", "K7QM-2XHL", "K7QM-2XHU", "K7QM-2XH!"]) {
      expect(checkCodeFormat(bad)).toMatchObject({ ok: false, reason: "bad_characters" });
    }
  });

  it("generates eight characters from the unambiguous alphabet", () => {
    let seed = 7;
    const bytes = (n: number) => Uint8Array.from({ length: n }, () => (seed = (seed * 73 + 41) % 256));
    const code = generateCode(bytes);
    expect(code).toHaveLength(8);
    expect([...code].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true);
    expect(checkCodeFormat(code)).toEqual({ ok: true, code });
  });

  it("skips bytes that would make some characters more likely", () => {
    const bytes = () => Uint8Array.from([255, 250, 240, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(generateCode(bytes)).toBe("ABCDEFGH");
  });

  it("hints at a code without revealing it", () => {
    expect(codeHint("K7QM-2XHD")).toBe("K7QM-••••");
    expect(codeHint("K7QM-2XHD")).not.toContain("2XHD");
  });
});

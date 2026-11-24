/**
 * Access codes: eight characters shown as XXXX-XXXX.
 * The alphabet leaves out I, L, O, U, 0 and 1 so a code read aloud or copied
 * by hand cannot be mistyped into a different valid code.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
export const CODE_LENGTH = 8;

export type CodeCheck =
  | { ok: true; code: string }
  | { ok: false; reason: "empty" | "too_short" | "too_long" | "bad_characters"; message: string };

/** Upper-cases and removes spaces, dashes and other separators people paste in. */
export function normalizeCode(input: string): string {
  return input
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s\-‐-―_.·:]/g, "");
}

/** XXXX-XXXX for a complete or partial code. Safe to call on every keystroke. */
export function formatCode(input: string): string {
  const n = normalizeCode(input).slice(0, CODE_LENGTH);
  return n.length > 4 ? `${n.slice(0, 4)}-${n.slice(4)}` : n;
}

export function checkCodeFormat(input: string): CodeCheck {
  const n = normalizeCode(input);
  if (n.length === 0) {
    return { ok: false, reason: "empty", message: "Enter the access code from your email." };
  }
  const bad = [...n].filter((ch) => !CODE_ALPHABET.includes(ch));
  if (bad.length > 0) {
    return {
      ok: false,
      reason: "bad_characters",
      message: "Codes use letters and numbers only, and never the letters I, L, O or U or the digits 0 and 1.",
    };
  }
  if (n.length < CODE_LENGTH) {
    return {
      ok: false,
      reason: "too_short",
      message: `That is ${n.length} of 8 characters. A code looks like K7QM-2XHD.`,
    };
  }
  if (n.length > CODE_LENGTH) {
    return { ok: false, reason: "too_long", message: "That is more than 8 characters. A code looks like K7QM-2XHD." };
  }
  return { ok: true, code: n };
}

/** Random code. Pass a byte source so tests can make it deterministic. */
export function generateCode(randomBytes: (n: number) => Uint8Array): string {
  let out = "";
  while (out.length < CODE_LENGTH) {
    const bytes = randomBytes(16);
    for (const b of bytes) {
      // Rejection sampling keeps every character equally likely.
      if (b < 240 && out.length < CODE_LENGTH) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
    }
  }
  return out;
}

/** What the owner sees in the admin list: enough to recognise a code, not enough to use it. */
export function codeHint(code: string): string {
  return `${normalizeCode(code).slice(0, 4)}-••••`;
}

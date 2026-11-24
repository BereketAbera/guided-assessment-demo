import { beforeEach, describe, expect, it } from "vitest";
import { SAMPLE_ANSWERS } from "@/lib/assessment/script";
import { newSandboxRef } from "@/lib/sandbox-ref";
import { codeKey, seal, unseal } from "@/lib/server/crypto";
import { docKey, pointerKey, Repo, RepoError, type SandboxDoc } from "@/lib/server/repo";
import { memoryStore, StoreConflict, type DocStore } from "@/lib/server/store";
import { adminRow } from "@/lib/server/views";
import { cfg, DAY, MINUTE, T0 } from "./fixtures";

let now = T0;
let data: Map<string, { body: string; etag: string; uploadedAt: number }>;
let store: DocStore;
let repo: Repo;
let ref: string;

beforeEach(() => {
  now = T0;
  data = new Map();
  store = memoryStore(data);
  repo = new Repo(store, cfg, () => now);
  ref = newSandboxRef(now);
});

const raw = () => data.get(docKey(ref))!.body;
const plain = (code: string) => code.replace("-", "");

/** Buys a code, starts the session and answers every question. Returns the session id. */
async function completeSession(firstName = "Maren"): Promise<{ code: string; sessionId: string }> {
  const { codes } = await repo.purchase(ref, "single");
  const code = codes[0]!;
  const located = (await repo.locate(ref, code))!;
  const sessionId = located.record.id;
  await repo.start(ref, sessionId, firstName);
  for (let i = 0; i < 20; i++) {
    const state = Repo.open((await repo.get(ref, sessionId))!.record);
    const open = state.priv?.turns.at(-1);
    if (!open || open.answer !== null) break;
    now += MINUTE;
    await repo.answer(ref, sessionId, open.questionId, SAMPLE_ANSWERS[open.questionId]!);
  }
  return { code, sessionId };
}

describe("sealing", () => {
  it("round-trips a value and cannot be read without the key", () => {
    const sealed = seal({ answer: "a private sentence" });
    expect(sealed).not.toContain("private");
    expect(unseal<{ answer: string }>(sealed).answer).toBe("a private sentence");
  });

  it("rejects a value that has been altered", () => {
    const sealed = seal({ answer: "x" });
    const altered = sealed.slice(0, -2) + (sealed.endsWith("A") ? "B" : "A") + sealed.slice(-1);
    expect(() => unseal(altered)).toThrow();
  });

  it("hashes codes one way, the same every time", () => {
    expect(codeKey("K7QM2XHD")).toBe(codeKey("K7QM2XHD"));
    expect(codeKey("K7QM2XHD")).not.toBe(codeKey("K7QM2XHE"));
    expect(codeKey("K7QM2XHD")).not.toContain("K7QM");
  });
});

describe("codes and sessions", () => {
  it("issues one code for a single and two for a two-pack, and lists them in the inbox", async () => {
    const single = await repo.purchase(ref, "single");
    const pair = await repo.purchase(ref, "twoPack");
    expect(single.codes).toHaveLength(1);
    expect(pair.codes).toHaveLength(2);
    expect(single.codes[0]).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const inbox = await repo.inbox(ref);
    expect(inbox.filter((m) => m.kind === "access_codes").flatMap((m) => m.codes.map((c) => c.code))).toEqual(
      expect.arrayContaining([...single.codes, ...pair.codes]),
    );
  });

  it("finds a session from the code alone, from a different visitor's browser", async () => {
    const { codes } = await repo.purchase(ref, "single");
    const elsewhere = newSandboxRef(now);
    const found = await repo.locate(elsewhere, codes[0]!.toLowerCase().replace("-", " "));
    expect(found).toMatchObject({ ref, status: "not_started" });
    expect(await repo.locate(elsewhere, "ZZZZ-ZZZZ")).toBeNull();
    await expect(repo.locate(elsewhere, "nope")).rejects.toBeInstanceOf(RepoError);
  });

  it("resumes on another device at the same question with every answer kept", async () => {
    const { codes } = await repo.purchase(ref, "single");
    const first = (await repo.locate(ref, codes[0]!))!;
    await repo.start(first.ref, first.record.id, "Maren");
    await repo.answer(first.ref, first.record.id, "begin-1", SAMPLE_ANSWERS["begin-1"]!);
    await repo.answer(first.ref, first.record.id, "begin-2", SAMPLE_ANSWERS["begin-2"]!);

    const second = (await repo.locate(newSandboxRef(now), codes[0]!))!;
    const state = Repo.open(second.record);
    expect(second.status).toBe("in_progress");
    expect(state.priv?.turns.at(-1)).toMatchObject({ questionId: "focus-1", answer: null });
    expect(state.priv?.turns.filter((t) => t.answer !== null)).toHaveLength(2);
  });

  it("never stores a code, a first name or an answer in the clear", async () => {
    const { code } = await completeSession("Maren");
    const everything = [...data.values()].map((d) => d.body).join("\n");
    expect(everything).not.toContain(code);
    expect(everything).not.toContain(plain(code));
    expect(everything).not.toContain("Maren");
    expect(everything).not.toContain("notebook");
    expect(everything).not.toContain("Deliberate Starter");
  });

  it("keeps both writes when two devices save at the same moment", async () => {
    await repo.purchase(ref, "single");
    let interfered = false;
    const racing: DocStore = {
      ...store,
      async put(key, body, ifMatch) {
        if (!interfered && key === docKey(ref)) {
          interfered = true;
          await repo.createCode(ref, "written in between");
          return store.put(key, body, ifMatch);
        }
        return store.put(key, body, ifMatch);
      },
    };
    const racer = new Repo(racing, cfg, () => now);
    await racer.createCode(ref, "the slower write");
    const notes = (JSON.parse(raw()) as SandboxDoc).sessions.map((s) => s.note);
    expect(notes).toContain("written in between");
    expect(notes).toContain("the slower write");
    await expect(store.put(docKey(ref), "{}", "stale-etag")).rejects.toBeInstanceOf(StoreConflict);
  });
});

describe("the owner's view", () => {
  it("builds the admin row without opening the answers", async () => {
    const { sessionId } = await completeSession();
    const located = (await repo.get(ref, sessionId))!;
    // If building the row tried to read the sealed half, this would throw.
    const row = adminRow({ ...located.record, sealed: "not-a-readable-value" }, located.status);
    expect(row).toMatchObject({ id: sessionId, status: "preparing", statusLabel: "Preparing report", calls: 12 });
    expect(row.inputTokens).toBeGreaterThan(row.outputTokens);
    expect(row.cost).toBeGreaterThan(0);
    expect(JSON.stringify(row)).not.toContain("Maren");
  });

  it("logs every time a transcript is opened, with the reason", async () => {
    const { sessionId } = await completeSession();
    const before = (await repo.read(ref))!.audit.filter((a) => a.action === "transcript_opened");
    expect(before).toHaveLength(0);
    const priv = await repo.openTranscript(ref, sessionId, "Customer asked for help");
    expect(priv?.firstName).toBe("Maren");
    expect(priv?.turns).toHaveLength(10);
    const doc = (await repo.read(ref))!;
    expect(doc.audit[0]).toMatchObject({ actor: "owner", action: "transcript_opened", sessionId });
    expect(doc.audit[0]?.detail).toContain("Customer asked for help");
    expect(doc.sessions.find((s) => s.id === sessionId)?.transcriptOpens).toBe(1);
  });

  it("creates a code by hand and reopens an expired session with its answers kept", async () => {
    const made = await repo.createCode(ref, "  Gift for a tester  ");
    expect((await repo.locate(newSandboxRef(now), made.code))?.record.note).toBe("Gift for a tester");

    const doc = (await repo.read(ref))!;
    const expired = doc.sessions.find((s) => s.note === "Ran past the time limit")!;
    expect((await repo.get(ref, expired.id))?.status).toBe("expired");
    await repo.reopen(ref, expired.id);
    const reopened = (await repo.get(ref, expired.id))!;
    expect(reopened.status).toBe("in_progress");
    expect(Repo.open(reopened.record).priv?.turns.at(-1)).toMatchObject({ questionId: "focus-1", answer: null });
    await expect(repo.reopen(ref, expired.id)).rejects.toThrow(/Only an expired session/);
  });
});

describe("the report job and the inbox", () => {
  it("is preparing, then ready, with nothing held in the browser", async () => {
    const { sessionId } = await completeSession();
    expect((await repo.get(ref, sessionId))?.status).toBe("preparing");
    expect((await repo.inbox(ref)).some((m) => m.kind === "report_ready")).toBe(false);
    await expect(repo.emailCopy(ref, sessionId)).rejects.toThrow(/not ready/);
    now += 30_000;
    expect((await repo.get(ref, sessionId))?.status).toBe("report_ready");
    expect((await repo.inbox(ref)).find((m) => m.kind === "report_ready")?.sessionId).toBe(sessionId);
    await repo.emailCopy(ref, sessionId);
    expect((await repo.inbox(ref)).some((m) => m.kind === "report_copy")).toBe(true);
  });
});

describe("deletion", () => {
  it("removes the answers and report from the stored record", async () => {
    const { code, sessionId } = await completeSession();
    now += 30_000;
    await repo.emailCopy(ref, sessionId);
    const sealedBefore = (JSON.parse(raw()) as SandboxDoc).sessions.find((s) => s.id === sessionId)!.sealed;
    expect(sealedBefore).toEqual(expect.any(String));

    await repo.deleteAnswers(ref, sessionId);
    const stored = JSON.parse(raw()) as SandboxDoc;
    const record = stored.sessions.find((s) => s.id === sessionId)!;
    expect(record.sealed).toBeNull();
    expect(record.meta).toMatchObject({ phase: "deleted", job: null });
    expect(raw()).not.toContain(sealedBefore!);
    expect(Repo.open(record).priv).toBeNull();
    expect((await repo.locate(newSandboxRef(now), code))?.status).toBe("deleted");
    expect(await repo.openTranscript(ref, sessionId, "check")).toBeNull();
    expect((await repo.inbox(ref)).some((m) => m.sessionId === sessionId)).toBe(false);
    expect(stored.audit[0]).toMatchObject({ actor: "customer", action: "answers_deleted", sessionId });
  });

  it("reset removes the visitor's document and the pointers to their codes", async () => {
    const { codes } = await repo.purchase(ref, "twoPack");
    expect(data.has(pointerKey(codeKey(plain(codes[0]!))))).toBe(true);
    await repo.reset(ref);
    expect(data.size).toBe(0);
    expect(await repo.locate(newSandboxRef(now), codes[0]!)).toBeNull();
  });

  it("the daily clean-up removes spaces older than seven days and leaves newer ones", async () => {
    await repo.purchase(ref, "single");
    now += 3 * DAY;
    const newer = newSandboxRef(now);
    await repo.purchase(newer, "single");
    now += 5 * DAY;
    const result = await repo.purge();
    expect(result.sandboxes).toBe(1);
    expect(await repo.read(ref)).toBeNull();
    expect(await repo.read(newer)).not.toBeNull();
  });
});

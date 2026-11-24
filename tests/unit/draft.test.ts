import { describe, expect, it } from "vitest";
import { clearDraft, draftKey, loadDraft, saveDraft, type DraftStorage } from "@/lib/draft";
import { isLiveRef, isSandboxRef, newSandboxRef } from "@/lib/sandbox-ref";

function fakeStorage(): DraftStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe("the answer being written", () => {
  it("is kept per session and per question, and can be edited until it is sent", () => {
    const storage = fakeStorage();
    saveDraft(storage, "S-1", "begin-1", "First thought");
    saveDraft(storage, "S-1", "begin-1", "First thought, corrected after dictation");
    expect(loadDraft(storage, "S-1", "begin-1")).toBe("First thought, corrected after dictation");
    expect(loadDraft(storage, "S-1", "begin-2")).toBe("");
    expect(loadDraft(storage, "S-2", "begin-1")).toBe("");
    expect(draftKey("S-1", "begin-1")).toBe("ga:draft:S-1:begin-1");
  });

  it("is removed when sent or emptied", () => {
    const storage = fakeStorage();
    saveDraft(storage, "S-1", "begin-1", "Something");
    clearDraft(storage, "S-1", "begin-1");
    expect(storage.data.size).toBe(0);
    saveDraft(storage, "S-1", "begin-1", "Something");
    saveDraft(storage, "S-1", "begin-1", "");
    expect(storage.data.size).toBe(0);
  });

  it("does not break the page when storage is blocked", () => {
    const blocked: DraftStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadDraft(blocked, "S-1", "begin-1")).toBe("");
    expect(() => saveDraft(blocked, "S-1", "begin-1", "x")).not.toThrow();
    expect(() => clearDraft(blocked, "S-1", "begin-1")).not.toThrow();
  });
});

describe("visitor spaces", () => {
  const now = Date.UTC(2026, 10, 24, 12);
  it("are named by the day and 128 random bits", () => {
    const ref = newSandboxRef(now);
    expect(ref).toMatch(/^20261124-[0-9a-f]{32}$/);
    expect(isSandboxRef(ref)).toBe(true);
    expect(newSandboxRef(now)).not.toBe(ref);
    expect(isSandboxRef("20261124-../../etc")).toBe(false);
    expect(isSandboxRef(undefined)).toBe(false);
  });

  it("live for seven days", () => {
    const ref = newSandboxRef(now);
    expect(isLiveRef(ref, now + 6 * 86_400_000)).toBe(true);
    expect(isLiveRef(ref, now + 7 * 86_400_000)).toBe(false);
  });
});

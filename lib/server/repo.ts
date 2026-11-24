import "server-only";
import { checkCodeFormat, codeHint, formatCode, generateCode } from "@/lib/codes";
import {
  answer as applyAnswer,
  deleteAnswers as applyDelete,
  newMeta,
  reopen as applyReopen,
  start as applyStart,
  statusOf,
  type AnswerOutcome,
  type MachineConfig,
} from "@/lib/assessment/machine";
import type { PrivatePayload, SessionMeta, SessionState, Status } from "@/lib/assessment/types";
import { codeKey, randomHex, seal, secureBytes, unseal } from "./crypto";
import { isLiveRef, RETENTION_DAYS } from "@/lib/sandbox-ref";
import { seedSessions } from "./seed";
import { StoreConflict, type DocStore } from "./store";

/**
 * One document per visitor ("sandbox") holds that visitor's codes, sessions,
 * simulated inbox and access log. A small pointer document per access code
 * lets any device find the session from the code alone.
 *
 * Each session has a plain half (status, timestamps, token counts) and a
 * sealed half (first name, answers, report). Lists and the admin table are
 * built from the plain half only.
 */
export const MAX_SESSIONS = 16;
const DAY = 24 * 60 * 60 * 1000;

export type SessionRecord = {
  id: string;
  codeKey: string;
  codeHint: string;
  source: "purchase" | "manual" | "seed";
  note: string | null;
  meta: SessionMeta;
  sealed: string | null;
  transcriptOpens: number;
};

export type AuditEntry = {
  at: number;
  actor: "owner" | "customer" | "system";
  action: "code_created" | "purchase_simulated" | "transcript_opened" | "session_reopened" | "answers_deleted";
  sessionId: string | null;
  detail: string;
};

export type InboxMessage = {
  id: string;
  at: number;
  kind: "access_codes" | "report_ready" | "report_copy" | "try_codes";
  subject: string;
  body: string;
  codes: { code: string; label: string }[];
  sessionId: string | null;
};

export type SandboxDoc = {
  v: 1;
  ref: string;
  createdAt: number;
  seq: number;
  sessions: SessionRecord[];
  inboxSealed: string;
  audit: AuditEntry[];
};

export class RepoError extends Error {
  constructor(
    public code: "not_found" | "full" | "bad_code" | "busy",
    message: string,
  ) {
    super(message);
    this.name = "RepoError";
  }
}

// ---- keys ------------------------------------------------------------------

export const SANDBOX_PREFIX = "ga1/sb/";
export const POINTER_PREFIX = "ga1/code/";
export function docKey(ref: string): string {
  return `${SANDBOX_PREFIX}${ref.slice(0, 8)}/${ref.slice(9)}.json`;
}
export function pointerKey(key: string): string {
  return `${POINTER_PREFIX}${key}.json`;
}

// ---- repository -------------------------------------------------------------

export type Located = { ref: string; record: SessionRecord; status: Status };

export class Repo {
  constructor(
    private store: DocStore,
    private cfg: MachineConfig,
    private now: () => number = Date.now,
  ) {}

  async read(ref: string): Promise<SandboxDoc | null> {
    const found = await this.store.get(docKey(ref));
    return found ? (JSON.parse(found.body) as SandboxDoc) : null;
  }

  private fresh(ref: string): SandboxDoc {
    const now = this.now();
    const seeded = seedSessions(now, this.cfg);
    return {
      v: 1,
      ref,
      createdAt: now,
      seq: 1038 + seeded.sessions.length,
      sessions: seeded.sessions,
      inboxSealed: seal(seeded.inbox),
      audit: seeded.audit,
    };
  }

  /**
   * Read, change, write back only if nobody else wrote in between. A second
   * device answering at the same moment makes one of the two retry on the
   * newer document, so no answer is lost.
   */
  async mutate<T>(ref: string, change: (doc: SandboxDoc) => T): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const found = await this.store.get(docKey(ref));
      const doc = found ? (JSON.parse(found.body) as SandboxDoc) : this.fresh(ref);
      const result = change(doc);
      try {
        await this.store.put(docKey(ref), JSON.stringify(doc), found?.etag);
        return result;
      } catch (error) {
        if (!(error instanceof StoreConflict)) throw error;
      }
    }
    throw new RepoError("busy", "The session is busy. Try again in a moment.");
  }

  private addSession(doc: SandboxDoc, source: SessionRecord["source"], note: string | null): { code: string; record: SessionRecord } {
    if (doc.sessions.length >= MAX_SESSIONS) {
      throw new RepoError("full", "This sample space is full. Use Reset demo in the footer to start again.");
    }
    const code = generateCode(secureBytes);
    const record: SessionRecord = {
      id: `S-${doc.seq++}`,
      codeKey: codeKey(code),
      codeHint: codeHint(code),
      source,
      note,
      meta: newMeta(this.now()),
      sealed: null,
      transcriptOpens: 0,
    };
    doc.sessions.push(record);
    return { code, record };
  }

  private async writePointers(ref: string, records: SessionRecord[]): Promise<void> {
    await Promise.all(
      records.map((r) =>
        this.store.put(pointerKey(r.codeKey), JSON.stringify({ ref, sessionId: r.id })).catch((error) => {
          if (!(error instanceof StoreConflict)) throw error;
        }),
      ),
    );
  }

  private pushInbox(doc: SandboxDoc, message: Omit<InboxMessage, "id">): void {
    const inbox = unseal<InboxMessage[]>(doc.inboxSealed);
    inbox.unshift({ ...message, id: randomHex(6) });
    doc.inboxSealed = seal(inbox.slice(0, 30));
  }

  /** Simulated checkout: creates one or two codes and "emails" them to the demo inbox. */
  async purchase(ref: string, pack: "single" | "twoPack"): Promise<{ codes: string[] }> {
    const count = pack === "twoPack" ? 2 : 1;
    const created = await this.mutate(ref, (doc) => {
      const made = Array.from({ length: count }, () => this.addSession(doc, "purchase", null));
      this.pushInbox(doc, {
        at: this.now(),
        kind: "access_codes",
        subject: count === 2 ? "Your two access codes" : "Your access code",
        body:
          count === 2
            ? "Thank you for your order. Each code opens one assessment. Keep one, and pass the other on."
            : "Thank you for your order. This code opens your assessment, and brings you back to it if you stop partway.",
        codes: made.map((m, i) => ({ code: formatCode(m.code), label: count === 2 ? `Code ${i + 1} of 2` : "Your code" })),
        sessionId: null,
      });
      doc.audit.unshift({
        at: this.now(),
        actor: "system",
        action: "purchase_simulated",
        sessionId: made[0]!.record.id,
        detail: `${count === 2 ? "Two-pack" : "Single"} purchase simulated; ${count} code${count === 2 ? "s" : ""} issued.`,
      });
      return made;
    });
    await this.writePointers(ref, created.map((c) => c.record));
    return { codes: created.map((c) => formatCode(c.code)) };
  }

  /** The owner creates a code by hand. The full code is returned once and never stored in the clear. */
  async createCode(ref: string, note: string): Promise<{ code: string; sessionId: string }> {
    const cleanNote = note.replace(/\s+/g, " ").trim().slice(0, 80) || null;
    const created = await this.mutate(ref, (doc) => {
      const made = this.addSession(doc, "manual", cleanNote);
      doc.audit.unshift({
        at: this.now(),
        actor: "owner",
        action: "code_created",
        sessionId: made.record.id,
        detail: cleanNote ? `Code created by hand. Note: ${cleanNote}` : "Code created by hand.",
      });
      return made;
    });
    await this.writePointers(ref, [created.record]);
    return { code: formatCode(created.code), sessionId: created.record.id };
  }

  /** Finds a session from a typed code: this visitor's own space first, then the shared pointer. */
  async locate(ownRef: string, input: string): Promise<Located | null> {
    const check = checkCodeFormat(input);
    if (!check.ok) throw new RepoError("bad_code", check.message);
    const key = codeKey(check.code);
    const now = this.now();
    const own = await this.read(ownRef);
    const mine = own?.sessions.find((s) => s.codeKey === key);
    if (mine) return { ref: ownRef, record: mine, status: statusOf(mine.meta, now) };
    const pointer = await this.store.get(pointerKey(key));
    if (!pointer) return null;
    const { ref, sessionId } = JSON.parse(pointer.body) as { ref: string; sessionId: string };
    const doc = await this.read(ref);
    const record = doc?.sessions.find((s) => s.id === sessionId && s.codeKey === key);
    return record ? { ref, record, status: statusOf(record.meta, now) } : null;
  }

  async get(ref: string, sessionId: string): Promise<Located | null> {
    const doc = await this.read(ref);
    const record = doc?.sessions.find((s) => s.id === sessionId);
    return record ? { ref, record, status: statusOf(record.meta, this.now()) } : null;
  }

  /** Opens the sealed half. Called for the customer's own session, and for the owner only through openTranscript. */
  static open(record: SessionRecord): SessionState {
    return { meta: record.meta, priv: record.sealed ? unseal<PrivatePayload>(record.sealed) : null };
  }

  private static close(record: SessionRecord, state: SessionState): void {
    record.meta = state.meta;
    record.sealed = state.priv ? seal(state.priv) : null;
  }

  private change<T>(ref: string, sessionId: string, apply: (record: SessionRecord, doc: SandboxDoc) => T): Promise<T> {
    return this.mutate(ref, (doc) => {
      const record = doc.sessions.find((s) => s.id === sessionId);
      if (!record) throw new RepoError("not_found", "That session no longer exists.");
      return apply(record, doc);
    });
  }

  start(ref: string, sessionId: string, firstName: string): Promise<void> {
    return this.change(ref, sessionId, (record) => {
      Repo.close(record, applyStart(Repo.open(record), firstName, this.now(), this.cfg));
    });
  }

  answer(
    ref: string,
    sessionId: string,
    questionId: string,
    text: string,
  ): Promise<{ outcome: AnswerOutcome; located: Located }> {
    return this.change(ref, sessionId, (record) => {
      const result = applyAnswer(Repo.open(record), questionId, text, this.now(), this.cfg);
      if (result.outcome !== "duplicate") Repo.close(record, result.state);
      return { outcome: result.outcome, located: { ref, record, status: statusOf(record.meta, this.now()) } };
    });
  }

  /** Removes the sealed half for good. The stored document is rewritten without it. */
  deleteAnswers(ref: string, sessionId: string): Promise<void> {
    return this.change(ref, sessionId, (record, doc) => {
      Repo.close(record, applyDelete(Repo.open(record), this.now()));
      const inbox = unseal<InboxMessage[]>(doc.inboxSealed).filter(
        (m) => !(m.sessionId === sessionId && m.kind === "report_copy"),
      );
      doc.inboxSealed = seal(inbox);
      doc.audit.unshift({
        at: this.now(),
        actor: "customer",
        action: "answers_deleted",
        sessionId,
        detail: "The customer deleted their answers and report.",
      });
    });
  }

  emailCopy(ref: string, sessionId: string): Promise<void> {
    return this.change(ref, sessionId, (record, doc) => {
      if (statusOf(record.meta, this.now()) !== "report_ready") {
        throw new RepoError("not_found", "The report is not ready yet.");
      }
      this.pushInbox(doc, {
        at: this.now(),
        kind: "report_copy",
        subject: "A copy of your report",
        body: "Here is the copy you asked for. In the real product this email carries the report as a PDF, along with the owner's resource PDFs.",
        codes: [],
        sessionId,
      });
    });
  }

  reopen(ref: string, sessionId: string): Promise<void> {
    return this.change(ref, sessionId, (record, doc) => {
      // Reopening changes dates only; the sealed answers are not opened.
      const state = applyReopen({ meta: record.meta, priv: null }, this.now(), this.cfg);
      record.meta = state.meta;
      doc.audit.unshift({
        at: this.now(),
        actor: "owner",
        action: "session_reopened",
        sessionId,
        detail: `Expired session reopened for ${this.cfg.reopenDays} more days. Answers kept.`,
      });
    });
  }

  /** The only path by which the owner reads answers. The reason is written to the access log first. */
  openTranscript(ref: string, sessionId: string, reason: string): Promise<PrivatePayload | null> {
    const cleanReason = reason.replace(/\s+/g, " ").trim().slice(0, 120) || "No reason given";
    return this.change(ref, sessionId, (record, doc) => {
      record.transcriptOpens += 1;
      doc.audit.unshift({
        at: this.now(),
        actor: "owner",
        action: "transcript_opened",
        sessionId,
        detail: `Transcript opened. Reason: ${cleanReason}`,
      });
      return Repo.open(record).priv;
    });
  }

  /** Simulated emails for this visitor, newest first, plus "report ready" notices worked out from the clock. */
  async inbox(ref: string, also?: { ref: string; sessionId: string }): Promise<InboxMessage[]> {
    const now = this.now();
    const messages: InboxMessage[] = [];
    const collect = (doc: SandboxDoc | null, onlySession?: string) => {
      if (!doc) return;
      const stored = unseal<InboxMessage[]>(doc.inboxSealed);
      messages.push(...stored.filter((m) => (onlySession ? m.sessionId === onlySession : true)));
      for (const s of doc.sessions) {
        if (s.source === "seed" || (onlySession && s.id !== onlySession)) continue;
        if (statusOf(s.meta, now) === "report_ready" && s.meta.job) {
          messages.push({
            id: `ready-${s.id}`,
            at: s.meta.job.readyAt,
            kind: "report_ready",
            subject: "Your report is ready",
            body: "Your report is ready to read. Your access code opens it at any time. In the real product the PDF and the owner's resource PDFs are attached.",
            codes: [],
            sessionId: s.id,
          });
        }
      }
    };
    collect(await this.read(ref));
    if (also && also.ref !== ref) collect(await this.read(also.ref), also.sessionId);
    return messages.sort((a, b) => (a.kind === "try_codes" ? 1 : b.kind === "try_codes" ? -1 : b.at - a.at));
  }

  /** Reset demo: removes this visitor's document and the pointers to its codes. */
  async reset(ref: string): Promise<void> {
    const doc = await this.read(ref);
    const keys = [docKey(ref), ...(doc?.sessions.filter((s) => s.source !== "seed").map((s) => pointerKey(s.codeKey)) ?? [])];
    await this.store.del(keys);
  }

  /** Daily clean-up: sandboxes past their retention, and pointers that outlived them. */
  async purge(): Promise<{ sandboxes: number; pointers: number }> {
    const now = this.now();
    const sandboxes = (await this.store.list(SANDBOX_PREFIX)).filter((d) => {
      const match = d.key.match(/^ga1\/sb\/(\d{8})\/([0-9a-f]{32})\.json$/);
      return !match || !isLiveRef(`${match[1]}-${match[2]}`, now);
    });
    const pointers = (await this.store.list(POINTER_PREFIX)).filter(
      (d) => now - d.uploadedAt > (RETENTION_DAYS + 1) * DAY,
    );
    await this.store.del([...sandboxes, ...pointers].map((d) => d.key));
    return { sandboxes: sandboxes.length, pointers: pointers.length };
  }
}

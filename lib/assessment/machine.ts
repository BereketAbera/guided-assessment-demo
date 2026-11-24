import { buildReport } from "@/lib/report/build";
import { isLaterInPart, nextStep, openingQuestion } from "./guide";
import { startJob, type Stage } from "./job";
import { addUsage, estimateTokens, exchangeUsage } from "./usage";
import { SessionError, type SessionMeta, type SessionState, type Status, type Turn } from "./types";

export const MAX_ANSWER_CHARS = 4000;
export const MAX_NAME_CHARS = 40;
const DAY = 24 * 60 * 60 * 1000;

export type MachineConfig = {
  timeLimitDays: number;
  reopenDays: number;
  promptTokens: number;
  stages: Stage[];
  parts: { id: string; title: string; minutes: number }[];
};

export function newMeta(now: number): SessionMeta {
  return {
    phase: "unused",
    createdAt: now,
    startedAt: null,
    lastActivityAt: null,
    expiresAt: null,
    reopenedAt: null,
    partIndex: 0,
    answeredCount: 0,
    usage: { inputTokens: 0, outputTokens: 0, calls: 0 },
    job: null,
    deletedAt: null,
  };
}

/** Status is the stored phase read against the clock: sessions expire and reports become ready without a write. */
export function statusOf(meta: SessionMeta, now: number): Status {
  switch (meta.phase) {
    case "unused":
      return "not_started";
    case "in_progress":
      return meta.expiresAt !== null && now > meta.expiresAt ? "expired" : "in_progress";
    case "submitted":
      return meta.job !== null && now >= meta.job.readyAt ? "report_ready" : "preparing";
    case "deleted":
      return "deleted";
  }
}

export function currentTurn(state: SessionState): Turn | null {
  const last = state.priv?.turns[state.priv.turns.length - 1];
  return last && last.answer === null ? last : null;
}

export function cleanName(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_CHARS);
}

/** Start: the first name is stored, the clock for the time limit begins, and the first question is asked. */
export function start(state: SessionState, firstName: string, now: number, cfg: MachineConfig): SessionState {
  const status = statusOf(state.meta, now);
  if (status === "deleted") throw new SessionError("deleted", "This code has been used and its answers were deleted.");
  if (status !== "not_started") throw new SessionError("already_started", "This assessment has already been started.");
  const name = cleanName(firstName);
  if (!name) throw new SessionError("name_required", "Enter your first name to begin.");
  const opening = openingQuestion();
  return {
    meta: {
      ...state.meta,
      phase: "in_progress",
      startedAt: now,
      lastActivityAt: now,
      expiresAt: now + cfg.timeLimitDays * DAY,
      partIndex: opening.partIndex,
      // The opening question is the first exchange: the prompt goes in, the question comes out.
      usage: addUsage(state.meta.usage, exchangeUsage(cfg.promptTokens, [], opening.question)),
    },
    priv: {
      firstName: name,
      turns: [{ ...opening, answer: null, askedAt: now, answeredAt: null }],
      closing: null,
      report: null,
    },
  };
}

export type AnswerOutcome = "next" | "finished" | "duplicate";

/**
 * Records one answer. The answer is editable until this is called and fixed
 * afterwards. Sending the same question twice (a retry after a dropped
 * connection, a double tap) changes nothing and reports "duplicate".
 */
export function answer(
  state: SessionState,
  questionId: string,
  text: string,
  now: number,
  cfg: MachineConfig,
): { state: SessionState; outcome: AnswerOutcome } {
  const status = statusOf(state.meta, now);
  if (status === "not_started") throw new SessionError("not_started", "This assessment has not been started yet.");
  if (status === "expired") throw new SessionError("expired", "The time limit for this assessment has passed.");
  if (status === "deleted") throw new SessionError("deleted", "The answers for this code were deleted.");
  const priv = state.priv;
  if (!priv) throw new SessionError("deleted", "The answers for this code were deleted.");

  const alreadyAnswered = priv.turns.some((t) => t.questionId === questionId && t.answer !== null);
  if (alreadyAnswered) return { state, outcome: "duplicate" };
  if (status !== "in_progress") throw new SessionError("not_in_progress", "This assessment is already complete.");

  const open = currentTurn(state);
  if (!open || open.questionId !== questionId) {
    throw new SessionError("wrong_question", "That is not the question currently open.");
  }
  const trimmed = text.trim();
  if (!trimmed) throw new SessionError("empty_answer", "Write an answer before you continue.");
  if (trimmed.length > MAX_ANSWER_CHARS) {
    throw new SessionError("too_long", `Answers can be up to ${MAX_ANSWER_CHARS} characters.`);
  }

  const turns: Turn[] = [...priv.turns.slice(0, -1), { ...open, answer: trimmed, answeredAt: now }];
  const step = nextStep(turns);
  const meta: SessionMeta = {
    ...state.meta,
    lastActivityAt: now,
    answeredCount: state.meta.answeredCount + 1,
  };

  if (!step.done) {
    const said = [step.next.reflection ?? "", step.next.question].join(" ");
    return {
      outcome: "next",
      state: {
        meta: {
          ...meta,
          partIndex: step.next.partIndex,
          usage: addUsage(meta.usage, exchangeUsage(cfg.promptTokens, turns, said)),
        },
        priv: {
          ...priv,
          turns: [...turns, { ...step.next, answer: null, askedAt: now, answeredAt: null }],
        },
      },
    };
  }

  // Last answer: one more exchange for the close, then the report is written as a background job.
  const report = buildReport({ ...priv, turns }, now);
  const withClose = addUsage(meta.usage, exchangeUsage(cfg.promptTokens, turns, step.closing));
  const reportCall = {
    inputTokens: exchangeUsage(cfg.promptTokens, turns, "").inputTokens,
    outputTokens: estimateTokens(JSON.stringify(report)),
    calls: 1,
  };
  return {
    outcome: "finished",
    state: {
      meta: {
        ...meta,
        phase: "submitted",
        partIndex: cfg.parts.length - 1,
        usage: addUsage(withClose, reportCall),
        job: startJob(cfg.stages, now),
      },
      priv: { ...priv, turns, closing: step.closing, report },
    },
  };
}

/** The owner reopens a session that ran past its time limit. Every answer is kept. */
export function reopen(state: SessionState, now: number, cfg: MachineConfig): SessionState {
  if (statusOf(state.meta, now) !== "expired") {
    throw new SessionError("not_expired", "Only an expired session can be reopened.");
  }
  return { ...state, meta: { ...state.meta, expiresAt: now + cfg.reopenDays * DAY, reopenedAt: now } };
}

/** Deletes the answers, the first name and the report. What remains says only that the code was used. */
export function deleteAnswers(state: SessionState, now: number): SessionState {
  if (state.meta.phase === "unused") {
    throw new SessionError("not_started", "There is nothing to delete yet.");
  }
  return {
    meta: { ...state.meta, phase: "deleted", job: null, deletedAt: now, lastActivityAt: now },
    priv: null,
  };
}

export type Progress = { partIndex: number; partCount: number; partTitle: string; minutesLeft: number };

/** "Part 2 of 5 · about 35 minutes left": the minutes come from the settings file, rounded to five. */
export function progressOf(state: SessionState, cfg: MachineConfig): Progress {
  const open = currentTurn(state);
  const partIndex = open ? open.partIndex : state.meta.partIndex;
  const part = cfg.parts[partIndex]!;
  const later = cfg.parts.slice(partIndex + 1).reduce((sum, p) => sum + p.minutes, 0);
  const inPart = open && isLaterInPart(open.questionId) ? part.minutes / 2 : part.minutes;
  const minutesLeft = Math.max(5, Math.ceil((later + inPart) / 5) * 5);
  return { partIndex, partCount: cfg.parts.length, partTitle: part.title, minutesLeft };
}

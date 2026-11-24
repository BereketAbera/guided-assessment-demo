import "server-only";
import { viewJob, type JobView } from "@/lib/assessment/job";
import { currentTurn, progressOf, type Progress } from "@/lib/assessment/machine";
import { SAMPLE_ANSWERS, SAMPLE_FOLLOW_UP_ANSWER } from "@/lib/assessment/script";
import type { Status } from "@/lib/assessment/types";
import { estimateCost } from "@/lib/assessment/usage";
import { settings } from "@/lib/settings";
import { machineConfig } from "./context";
import { Repo, type Located, type SessionRecord } from "./repo";

export function pathFor(status: Status): string {
  switch (status) {
    case "not_started":
      return "/start";
    case "in_progress":
      return "/session";
    case "preparing":
      return "/preparing";
    case "report_ready":
      return "/report";
    case "expired":
    case "deleted":
      return "/code";
  }
}

export type ConversationView = {
  sessionId: string;
  codeHint: string;
  firstName: string;
  progress: Progress;
  current: {
    questionId: string;
    kind: "core" | "followup";
    reflection: string | null;
    question: string;
    /** The invented answer behind "Use an example answer". Sent with the question, so the script itself stays on the server. */
    example: string;
  } | null;
  answers: { questionId: string; partIndex: number; question: string; answer: string }[];
  savedAt: number | null;
  resumed: boolean;
};

/** What the conversation screen needs. Only ever built for the session this browser has open. */
export function conversationView(located: Located): ConversationView {
  const state = Repo.open(located.record);
  const open = currentTurn(state);
  const turns = state.priv?.turns ?? [];
  return {
    sessionId: located.record.id,
    codeHint: located.record.codeHint,
    firstName: state.priv?.firstName ?? "",
    progress: progressOf(state, machineConfig()),
    current: open
      ? {
          questionId: open.questionId,
          kind: open.kind,
          reflection: open.reflection,
          question: open.question,
          example: open.kind === "followup" ? SAMPLE_FOLLOW_UP_ANSWER : (SAMPLE_ANSWERS[open.questionId] ?? ""),
        }
      : null,
    answers: turns
      .filter((t) => t.answer !== null)
      .map((t) => ({ questionId: t.questionId, partIndex: t.partIndex, question: t.question, answer: t.answer! })),
    savedAt: located.record.meta.lastActivityAt,
    resumed: located.record.meta.answeredCount > 0,
  };
}

export function jobViewOf(record: SessionRecord, now: number): JobView | null {
  return record.meta.job ? viewJob(record.meta.job, settings.reportJob.stages, now) : null;
}

export type AdminRow = {
  id: string;
  codeHint: string;
  source: SessionRecord["source"];
  note: string | null;
  status: Status;
  statusLabel: string;
  createdAt: number;
  startedAt: number | null;
  lastActivityAt: number | null;
  expiresAt: number | null;
  reopenedAt: number | null;
  deletedAt: number | null;
  reportReadyAt: number | null;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  cost: number;
  transcriptOpens: number;
};

export function statusLabel(status: Status, partIndex: number): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "in_progress":
      return `In progress · part ${partIndex + 1} of ${settings.parts.length}`;
    case "expired":
      return `Expired · part ${partIndex + 1} of ${settings.parts.length}`;
    case "preparing":
      return "Preparing report";
    case "report_ready":
      return "Report ready";
    case "deleted":
      return "Answers deleted";
  }
}

/** The owner's row for a session, built from the plain half only. Nothing here opens an answer. */
export function adminRow(record: SessionRecord, status: Status): AdminRow {
  const m = record.meta;
  return {
    id: record.id,
    codeHint: record.codeHint,
    source: record.source,
    note: record.note,
    status,
    statusLabel: statusLabel(status, m.partIndex),
    createdAt: m.createdAt,
    startedAt: m.startedAt,
    lastActivityAt: m.lastActivityAt,
    expiresAt: m.expiresAt,
    reopenedAt: m.reopenedAt,
    deletedAt: m.deletedAt,
    reportReadyAt: m.job?.readyAt ?? null,
    inputTokens: m.usage.inputTokens,
    outputTokens: m.usage.outputTokens,
    calls: m.usage.calls,
    cost: estimateCost(m.usage, settings.model),
    transcriptOpens: record.transcriptOpens,
  };
}

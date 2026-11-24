import type { Report } from "@/lib/report/types";

/** One question and, once given, its answer. The guide's reflection on the previous answer sits above it. */
export type Turn = {
  questionId: string;
  partIndex: number;
  kind: "core" | "followup";
  reflection: string | null;
  question: string;
  answer: string | null;
  askedAt: number;
  answeredAt: number | null;
};

/** The private half of a session. Stored encrypted; never read to build a list. */
export type PrivatePayload = {
  firstName: string;
  turns: Turn[];
  closing: string | null;
  report: Report | null;
};

export type Usage = { inputTokens: number; outputTokens: number; calls: number };

export type Phase = "unused" | "in_progress" | "submitted" | "deleted";

/** What a customer or the owner sees. Derived from the phase and the clock. */
export type Status = "not_started" | "in_progress" | "expired" | "preparing" | "report_ready" | "deleted";

export type Job = { startedAt: number; readyAt: number };

/** The plain half of a session: enough to run the app and the admin list without opening an answer. */
export type SessionMeta = {
  phase: Phase;
  createdAt: number;
  startedAt: number | null;
  lastActivityAt: number | null;
  expiresAt: number | null;
  reopenedAt: number | null;
  partIndex: number;
  answeredCount: number;
  usage: Usage;
  job: Job | null;
  deletedAt: number | null;
};

export type SessionState = { meta: SessionMeta; priv: PrivatePayload | null };

export class SessionError extends Error {
  constructor(
    public code:
      | "not_started"
      | "already_started"
      | "expired"
      | "not_in_progress"
      | "wrong_question"
      | "empty_answer"
      | "too_long"
      | "name_required"
      | "deleted"
      | "not_expired"
      | "not_ready",
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

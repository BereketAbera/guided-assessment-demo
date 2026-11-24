import "server-only";
import { codeHint, formatCode, generateCode } from "@/lib/codes";
import { answer, currentTurn, newMeta, start, type MachineConfig } from "@/lib/assessment/machine";
import {
  SAMPLE_ANSWERS,
  SAMPLE_FOLLOW_UP_ANSWER,
  SECOND_VOICE_ANSWERS,
  THIRD_VOICE_ANSWERS,
} from "@/lib/assessment/script";
import type { SessionState, Usage } from "@/lib/assessment/types";
import { codeKey, seal, secureBytes } from "./crypto";
import type { AuditEntry, InboxMessage, SessionRecord } from "./repo";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Plays invented answers through the same state machine a real session uses. */
export function play(
  firstName: string,
  answers: Record<string, string>,
  startedAt: number,
  cfg: MachineConfig,
  stepMs = 5 * MINUTE,
): SessionState {
  let state = start({ meta: newMeta(startedAt - 20 * MINUTE), priv: null }, firstName, startedAt, cfg);
  let clock = startedAt;
  for (;;) {
    const open = currentTurn(state);
    if (!open) break;
    const text = answers[open.questionId] ?? (open.kind === "followup" ? SAMPLE_FOLLOW_UP_ANSWER : undefined);
    if (text === undefined) break;
    clock += stepMs;
    state = answer(state, open.questionId, text, clock, cfg).state;
  }
  return state;
}

/**
 * Example rows for the admin area, all invented. Their token counts are those
 * of a full-length conversation (about 35 exchanges), so the cost column shows
 * realistic figures; a session run in this sample is far shorter.
 */
export function seedSessions(
  now: number,
  cfg: MachineConfig,
): { sessions: SessionRecord[]; inbox: InboxMessage[]; audit: AuditEntry[] } {
  let seq = 1038;
  const make = (
    state: SessionState,
    usage: Usage,
    note: string | null,
    source: SessionRecord["source"] = "seed",
  ): { code: string; record: SessionRecord } => {
    const code = generateCode(secureBytes);
    return {
      code,
      record: {
        id: `S-${seq++}`,
        codeKey: codeKey(code),
        codeHint: codeHint(code),
        source,
        note,
        meta: { ...state.meta, usage },
        sealed: state.priv ? seal(state.priv) : null,
        transcriptOpens: 0,
      },
    };
  };

  const finished = make(
    play("Maren", SAMPLE_ANSWERS, now - 2 * DAY - 55 * MINUTE, cfg),
    { inputTokens: 248_300, outputTokens: 9_120, calls: 37 },
    "Completed two days ago",
  );
  const underway = make(
    play("Tobias", SECOND_VOICE_ANSWERS, now - 3 * HOUR - 20 * MINUTE, cfg),
    { inputTokens: 96_400, outputTokens: 3_900, calls: 17 },
    "Partway through",
  );
  const lapsed = make(
    play("Ines", THIRD_VOICE_ANSWERS, now - 16 * DAY, cfg),
    { inputTokens: 41_200, outputTokens: 1_650, calls: 8 },
    "Ran past the time limit",
  );
  const removedState = play("Removed", SAMPLE_ANSWERS, now - 6 * DAY, cfg);
  const removed = make(
    {
      meta: { ...removedState.meta, phase: "deleted", job: null, deletedAt: now - 5 * DAY, lastActivityAt: now - 5 * DAY },
      priv: null,
    },
    { inputTokens: 212_900, outputTokens: 8_300, calls: 33 },
    "Answers deleted by the customer",
  );
  const gift = make(
    { meta: newMeta(now - 1 * DAY), priv: null },
    { inputTokens: 0, outputTokens: 0, calls: 0 },
    "Gift code for a colleague",
    "manual",
  );

  return {
    sessions: [finished.record, underway.record, lapsed.record, removed.record, gift.record],
    inbox: [
      {
        id: "try-codes",
        at: now,
        kind: "try_codes",
        subject: "Codes to try in this sample",
        body: "Three ready-made codes, so you can see what a returning, an expired and a used code look like without waiting.",
        codes: [
          { code: formatCode(underway.code), label: "Partway through: resumes at part 3" },
          { code: formatCode(lapsed.code), label: "Expired: reopen it in the owner admin" },
          { code: formatCode(removed.code), label: "Used: answers were deleted" },
        ],
        sessionId: null,
      },
    ],
    audit: [
      {
        at: now - 1 * DAY,
        actor: "owner",
        action: "code_created",
        sessionId: gift.record.id,
        detail: "Code created by hand. Note: Gift code for a colleague",
      },
      {
        at: now - 5 * DAY,
        actor: "customer",
        action: "answers_deleted",
        sessionId: removed.record.id,
        detail: "The customer deleted their answers and report.",
      },
    ],
  };
}

import { describe, expect, it } from "vitest";
import { jobDurationMs } from "@/lib/assessment/job";
import {
  answer,
  currentTurn,
  deleteAnswers,
  MAX_ANSWER_CHARS,
  newMeta,
  progressOf,
  reopen,
  start,
  statusOf,
} from "@/lib/assessment/machine";
import { SAMPLE_ANSWERS, SCRIPT } from "@/lib/assessment/script";
import { SessionError, type SessionState } from "@/lib/assessment/types";
import { cfg, DAY, LONG, MINUTE, T0 } from "./fixtures";

const fresh = (): SessionState => ({ meta: newMeta(T0), priv: null });
const started = () => start(fresh(), "  Maren  ", T0, cfg);

/** Answers every question with the sample answers until the session is submitted. */
function finish(state: SessionState, from = T0): SessionState {
  let clock = from;
  for (let open = currentTurn(state); open; open = currentTurn(state)) {
    clock += MINUTE;
    state = answer(state, open.questionId, SAMPLE_ANSWERS[open.questionId] ?? LONG, clock, cfg).state;
  }
  return state;
}

describe("starting", () => {
  it("is not started until a first name is given", () => {
    expect(statusOf(fresh().meta, T0)).toBe("not_started");
    expect(() => start(fresh(), "   ", T0, cfg)).toThrow(SessionError);
  });

  it("stores the name, asks the first question and starts the time limit", () => {
    const s = started();
    expect(statusOf(s.meta, T0)).toBe("in_progress");
    expect(s.priv?.firstName).toBe("Maren");
    expect(currentTurn(s)?.questionId).toBe(SCRIPT[0]!.id);
    expect(s.meta.expiresAt).toBe(T0 + 14 * DAY);
  });

  it("cannot be started twice", () => {
    expect(() => start(started(), "Maren", T0, cfg)).toThrow(/already been started/);
  });
});

describe("answering", () => {
  it("saves the answer and asks the next question with a reflection", () => {
    const { state, outcome } = answer(started(), "begin-1", LONG, T0 + MINUTE, cfg);
    expect(outcome).toBe("next");
    expect(state.priv?.turns[0]).toMatchObject({ answer: LONG, answeredAt: T0 + MINUTE });
    const next = currentTurn(state)!;
    expect(next.questionId).toBe("begin-2");
    expect(next.reflection).toBe("You like to see the shape of the day before you step into it.");
    expect(state.meta).toMatchObject({ answeredCount: 1, lastActivityAt: T0 + MINUTE });
  });

  it("asks one follow-up after a very short answer, and never a second", () => {
    const first = answer(started(), "begin-1", "It was quiet.", T0 + MINUTE, cfg).state;
    expect(currentTurn(first)).toMatchObject({ questionId: "begin-1-more", kind: "followup", partIndex: 0 });
    const second = answer(first, "begin-1-more", "Fine.", T0 + 2 * MINUTE, cfg).state;
    expect(currentTurn(second)).toMatchObject({ questionId: "begin-2", kind: "core" });
  });

  it("keeps an answer editable until it is sent, then fixes it", () => {
    const s = started();
    // Nothing is stored for the open question while it is being written.
    expect(currentTurn(s)?.answer).toBeNull();
    const sent = answer(s, "begin-1", `  ${LONG}  `, T0 + MINUTE, cfg).state;
    expect(sent.priv?.turns[0]?.answer).toBe(LONG);
    // A second send for the same question (retry, double tap) changes nothing.
    const again = answer(sent, "begin-1", "Something different entirely, sent a second time by mistake.", T0 + 2 * MINUTE, cfg);
    expect(again.outcome).toBe("duplicate");
    expect(again.state).toBe(sent);
  });

  it("rejects an empty answer, an over-long answer and an answer to the wrong question", () => {
    const s = started();
    expect(() => answer(s, "begin-1", "   ", T0, cfg)).toThrow(/Write an answer/);
    expect(() => answer(s, "begin-1", "x".repeat(MAX_ANSWER_CHARS + 1), T0, cfg)).toThrow(/up to/);
    expect(() => answer(s, "focus-1", LONG, T0, cfg)).toThrow(/not the question currently open/);
    expect(() => answer(fresh(), "begin-1", LONG, T0, cfg)).toThrow(/not been started/);
  });

  it("counts more input tokens on every exchange, because the whole conversation is sent each time", () => {
    const zero = started();
    const one = answer(zero, "begin-1", LONG, T0 + MINUTE, cfg).state;
    const two = answer(one, "begin-2", LONG, T0 + 2 * MINUTE, cfg).state;
    const opening = zero.meta.usage.inputTokens;
    const firstAnswer = one.meta.usage.inputTokens - opening;
    const secondAnswer = two.meta.usage.inputTokens - one.meta.usage.inputTokens;
    expect(opening).toBe(cfg.promptTokens);
    expect(firstAnswer).toBeGreaterThan(opening);
    expect(secondAnswer).toBeGreaterThan(firstAnswer);
    expect(two.meta.usage.calls).toBe(3);
  });
});

describe("resuming", () => {
  it("comes back to the same question with every answer kept after a round trip through storage", () => {
    let s = started();
    s = answer(s, "begin-1", LONG, T0 + MINUTE, cfg).state;
    s = answer(s, "begin-2", LONG, T0 + 2 * MINUTE, cfg).state;
    const restored = JSON.parse(JSON.stringify(s)) as SessionState;
    expect(currentTurn(restored)?.questionId).toBe("focus-1");
    expect(restored.priv?.turns.filter((t) => t.answer !== null)).toHaveLength(2);
    expect(statusOf(restored.meta, T0 + 3 * DAY)).toBe("in_progress");
    const onward = answer(restored, "focus-1", LONG, T0 + 3 * DAY, cfg);
    expect(onward.outcome).toBe("next");
  });

  it("shows progress by part, with the minutes left rounded to five", () => {
    let s = started();
    expect(progressOf(s, cfg)).toMatchObject({ partIndex: 0, partCount: 5, minutesLeft: 50 });
    s = answer(s, "begin-1", LONG, T0, cfg).state;
    expect(progressOf(s, cfg)).toMatchObject({ partIndex: 0, minutesLeft: 45 });
    s = answer(s, "begin-2", LONG, T0, cfg).state;
    expect(progressOf(s, cfg)).toMatchObject({ partIndex: 1, partTitle: "Where your attention goes", minutesLeft: 40 });
  });
});

describe("expiring and reopening", () => {
  const partway = () => answer(started(), "begin-1", LONG, T0 + MINUTE, cfg).state;

  it("expires when the time limit passes, and refuses further answers", () => {
    const s = partway();
    const late = T0 + 14 * DAY + MINUTE;
    expect(statusOf(s.meta, T0 + 14 * DAY)).toBe("in_progress");
    expect(statusOf(s.meta, late)).toBe("expired");
    expect(() => answer(s, "begin-2", LONG, late, cfg)).toThrow(/time limit/);
  });

  it("reopens with every answer kept and the same question open", () => {
    const s = partway();
    const late = T0 + 20 * DAY;
    const reopened = reopen(s, late, cfg);
    expect(statusOf(reopened.meta, late)).toBe("in_progress");
    expect(reopened.meta).toMatchObject({ reopenedAt: late, expiresAt: late + 7 * DAY });
    expect(reopened.priv).toBe(s.priv);
    expect(currentTurn(reopened)?.questionId).toBe("begin-2");
    expect(answer(reopened, "begin-2", LONG, late + MINUTE, cfg).outcome).toBe("next");
  });

  it("only reopens a session that has expired", () => {
    expect(() => reopen(partway(), T0 + DAY, cfg)).toThrow(/Only an expired session/);
    expect(() => reopen(fresh(), T0 + DAY, cfg)).toThrow(SessionError);
  });
});

describe("finishing", () => {
  it("hands over to the report job after the last answer", () => {
    const done = finish(started());
    const sentAt = done.meta.lastActivityAt!;
    expect(done.meta.phase).toBe("submitted");
    expect(currentTurn(done)).toBeNull();
    expect(done.priv?.closing).toMatch(/last question/);
    expect(done.priv?.report?.firstName).toBe("Maren");
    expect(done.meta.job).toEqual({ startedAt: sentAt, readyAt: sentAt + jobDurationMs(cfg.stages) });
    expect(statusOf(done.meta, sentAt + 1000)).toBe("preparing");
    expect(statusOf(done.meta, done.meta.job!.readyAt)).toBe("report_ready");
    expect(() => answer(done, "anything", LONG, sentAt, cfg)).toThrow(/already complete/);
  });

  it("does not expire once the answers are in", () => {
    const done = finish(started());
    expect(statusOf(done.meta, T0 + 400 * DAY)).toBe("report_ready");
  });
});

describe("deleting", () => {
  it("removes the name, the answers and the report, and leaves only that the code was used", () => {
    const done = finish(started());
    const gone = deleteAnswers(done, T0 + DAY);
    expect(gone.priv).toBeNull();
    expect(gone.meta).toMatchObject({ phase: "deleted", job: null, deletedAt: T0 + DAY });
    expect(statusOf(gone.meta, T0 + 2 * DAY)).toBe("deleted");
    expect(JSON.stringify(gone)).not.toContain("Maren");
    expect(JSON.stringify(gone)).not.toContain("notebook");
  });

  it("cannot be used again after deletion", () => {
    const gone = deleteAnswers(answer(started(), "begin-1", LONG, T0, cfg).state, T0 + DAY);
    expect(() => answer(gone, "begin-2", LONG, T0 + DAY, cfg)).toThrow(/deleted/);
    expect(() => start(gone, "Maren", T0 + DAY, cfg)).toThrow(/deleted/);
  });

  it("has nothing to delete before the session starts", () => {
    expect(() => deleteAnswers(fresh(), T0)).toThrow(/nothing to delete/);
  });
});

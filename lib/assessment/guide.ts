import { CLOSING_LINE, FOLLOW_UP_REFLECTION, SCRIPT, SHORT_ANSWER_WORDS, type ScriptQuestion } from "./script";
import type { Turn } from "./types";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Stems are plain lower-case words or phrases; a stem matches at the start of a word. */
export function matchesStem(text: string, stem: string): boolean {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9']+/g, " ")} `;
  return haystack.includes(` ${stem.toLowerCase()}`);
}

function coreId(questionId: string): string {
  return questionId.replace(/-more$/, "");
}

function scriptQuestion(questionId: string): ScriptQuestion {
  const q = SCRIPT.find((s) => s.id === coreId(questionId));
  if (!q) throw new Error(`Unknown question ${questionId}`);
  return q;
}

/** The one-line reflection said after a question has been answered. */
export function reflect(q: ScriptQuestion, answer: string): string {
  const rule = q.reflections.find((r) => r.stems.some((stem) => matchesStem(answer, stem)));
  return rule ? rule.line : q.fallback;
}

export type NextQuestion = Pick<Turn, "questionId" | "partIndex" | "kind" | "reflection" | "question">;
export type GuideStep = { done: false; next: NextQuestion } | { done: true; closing: string };

export function openingQuestion(): NextQuestion {
  const q = SCRIPT[0]!;
  return { questionId: q.id, partIndex: q.partIndex, kind: "core", reflection: null, question: q.text };
}

/**
 * Decides what comes after the last answered turn: one follow-up when the
 * answer was very short, otherwise the next question, otherwise the close.
 * The guide chooses, which is why the app shows progress by part and never
 * as "question 4 of 10".
 */
export function nextStep(turns: Turn[]): GuideStep {
  const last = turns[turns.length - 1];
  if (!last || last.answer === null) throw new Error("The last question has not been answered yet.");
  const q = scriptQuestion(last.questionId);

  if (last.kind === "core" && countWords(last.answer) < SHORT_ANSWER_WORDS) {
    return {
      done: false,
      next: {
        questionId: `${q.id}-more`,
        partIndex: q.partIndex,
        kind: "followup",
        reflection: FOLLOW_UP_REFLECTION,
        question: q.followUp,
      },
    };
  }

  // A follow-up and the question it follows are reflected on together.
  const said = turns
    .filter((t) => coreId(t.questionId) === q.id && t.answer !== null)
    .map((t) => t.answer)
    .join(" ");
  const reflection = reflect(q, said);
  const following = SCRIPT[SCRIPT.indexOf(q) + 1];
  if (!following) return { done: true, closing: `${reflection} ${CLOSING_LINE}` };
  return {
    done: false,
    next: {
      questionId: following.id,
      partIndex: following.partIndex,
      kind: "core",
      reflection,
      question: following.text,
    },
  };
}

/** True when this question is the second (or later) core question of its part. */
export function isLaterInPart(questionId: string): boolean {
  const q = scriptQuestion(questionId);
  const firstOfPart = SCRIPT.find((s) => s.partIndex === q.partIndex);
  return firstOfPart !== q;
}

import { CLOSING_LINE, FOLLOW_UP_REFLECTION, SCRIPT, SHORT_ANSWER_WORDS, type ScriptQuestion } from "./script";
import type { Turn } from "./types";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Words that turn the meaning of what follows them around. A stem that comes
 * within a few words after one of these, in the same clause, is not counted:
 * "I never plan" must not read as planning.
 */
const NEGATORS = new Set([
  "not", "never", "no", "nor", "neither", "cannot", "hate", "dislike", "avoid", "rarely", "seldom", "hardly", "dont", "cant", "wont",
]);
const NEGATION_REACH = 4;

function isNegator(word: string): boolean {
  return NEGATORS.has(word) || word.endsWith("n't");
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** Clauses end at sentence punctuation and at "but", so a "not" does not reach into the next thought. */
function clauses(text: string): string[][] {
  return text
    .split(/[.!?;:\n]+|\bbut\b/i)
    .map(tokens)
    .filter((c) => c.length > 0);
}

/**
 * Stems are plain lower-case words or phrases. A stem matches at the start of
 * a word ("priorit" matches "priorities", "late" does not match "translate"),
 * and only when it is not negated.
 */
export function matchesStem(text: string, stem: string): boolean {
  const wanted = tokens(stem).join(" ");
  if (!wanted) return false;
  const span = wanted.split(" ").length;
  return clauses(text).some((clause) =>
    clause.some((_, i) => {
      if (!clause.slice(i, i + span).join(" ").startsWith(wanted)) return false;
      return !clause.slice(Math.max(0, i - NEGATION_REACH), i).some(isNegator);
    }),
  );
}

export function countStems(text: string, stems: string[]): number {
  return stems.filter((stem) => matchesStem(text, stem)).length;
}

function coreId(questionId: string): string {
  return questionId.replace(/-more$/, "");
}

function scriptQuestion(questionId: string): ScriptQuestion {
  const q = SCRIPT.find((s) => s.id === coreId(questionId));
  if (!q) throw new Error(`Unknown question ${questionId}`);
  return q;
}

/**
 * The one-line reflection said after a question has been answered: the rule
 * with the most words found in the answer, or a neutral line when none fits.
 */
export function reflect(q: ScriptQuestion, answer: string): string {
  let best: { line: string; hits: number } | null = null;
  for (const rule of q.reflections) {
    const hits = countStems(answer, rule.stems);
    if (hits > 0 && (!best || hits > best.hits)) best = { line: rule.line, hits };
  }
  return best ? best.line : q.fallback;
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

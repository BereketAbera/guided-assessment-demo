import { SAMPLE_ANSWERS, SCRIPT } from "@/lib/assessment/script";
import type { Turn } from "@/lib/assessment/types";
import { buildReport } from "./build";

/** The public sample report: the invented answers run through the same builder as a real session. */
export function sampleReport() {
  const at = Date.UTC(2026, 10, 18, 15, 0, 0);
  const turns: Turn[] = SCRIPT.map((q) => ({
    questionId: q.id,
    partIndex: q.partIndex,
    kind: "core",
    reflection: null,
    question: q.text,
    answer: SAMPLE_ANSWERS[q.id] ?? "",
    askedAt: at,
    answeredAt: at,
  }));
  return buildReport({ firstName: "Maren", turns, closing: null, report: null }, at);
}

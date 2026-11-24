import { describe, expect, it } from "vitest";
import { matchesStem, reflect } from "@/lib/assessment/guide";
import { SCRIPT, SECOND_VOICE_ANSWERS } from "@/lib/assessment/script";
import type { Turn } from "@/lib/assessment/types";
import { addUsage, estimateCost, estimateTokens, exchangeUsage, formatCost } from "@/lib/assessment/usage";
import { buildReport, firstSentence } from "@/lib/report/build";
import { sampleReport } from "@/lib/report/sample";

const turn = (questionId: string, answer: string): Turn => ({
  questionId,
  partIndex: 0,
  kind: "core",
  reflection: null,
  question: "?",
  answer,
  askedAt: 0,
  answeredAt: 0,
});

describe("the scripted guide", () => {
  it("matches stems at the start of a word only", () => {
    expect(matchesStem("Clear priorities, please", "priorit")).toBe(true);
    expect(matchesStem("I stayed late.", "late")).toBe(true);
    expect(matchesStem("I translate documents", "late")).toBe(false);
    expect(matchesStem("We work out loud", "out loud")).toBe(true);
  });

  it("reflects an answer with the first rule that fits, or a neutral line", () => {
    const q = SCRIPT.find((s) => s.id === "others-2")!;
    expect(reflect(q, "I usually wait and think about it overnight.")).toMatch(/think before you answer/);
    expect(reflect(q, "It depends on the day.")).toBe(q.fallback);
  });
});

describe("the report as labeled sections", () => {
  const report = sampleReport();

  it("fills every field of the template", () => {
    expect(report.title).toBe("Your Working Style Reflection");
    expect(report.firstName).toBe("Maren");
    expect(report.dateISO).toBe("2026-11-18");
    expect(report.profile.traits).toHaveLength(5);
    expect(report.sections.map((s) => s.heading)).toEqual([
      "How you begin",
      "Where your attention goes",
      "Working with others",
      "Under pressure",
      "What you want next",
    ]);
    expect(report.nextSteps).toHaveLength(3);
    expect(new Set(report.nextSteps.map((s) => s.title)).size).toBe(3);
    expect(report.resources).toHaveLength(3);
    expect(report.note).toMatch(/not a diagnosis/);
  });

  it("names the profile and key statement from the strongest patterns", () => {
    expect(report.profile.name).toBe("The Deliberate Starter");
    expect(report.profile.traits.map((t) => [t.name, t.score])).toEqual([
      ["Deliberate starter", 5],
      ["Deep focus", 4],
      ["Thinks before speaking", 5],
      ["Steady under pressure", 4],
      ["Refiner", 3],
    ]);
    expect(report.keyStatement).toBe(
      "You do your best work when you can see the whole before you begin, and you have room to think before you speak. What you are asking for next is less, done better.",
    );
  });

  it("quotes the person's own first sentence in each section", () => {
    expect(report.sections[2]?.quote).toBe("My colleague Dana gives me space.");
    expect(firstSentence("One. Two.")).toBe("One.");
    expect(firstSentence(`${"word ".repeat(60)}end`, 40).endsWith("…")).toBe(true);
  });

  it("reads a different voice differently", () => {
    const turns = Object.entries(SECOND_VOICE_ANSWERS).map(([id, text]) => turn(id, text));
    const other = buildReport({ firstName: "Tobias", turns, closing: null, report: null }, Date.UTC(2026, 10, 24));
    expect(other.profile.traits[0]?.name).toBe("Quick starter");
    expect(other.profile.traits[1]?.name).toBe("Wide attention");
    expect(other.keyStatement).not.toBe(report.keyStatement);
  });

  it("says so when a part gave no clear pattern", () => {
    const flat = buildReport({ firstName: "Ines", turns: [turn("begin-1", "It was fine.")], closing: null, report: null }, 0);
    expect(flat.profile.traits.every((t) => t.score === 2)).toBe(true);
    expect(flat.profile.traits[0]?.line).toMatch(/did not lean strongly/);
  });
});

describe("token and cost estimates", () => {
  it("estimates about four characters to a token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });

  it("sends the prompt and the whole conversation on every call", () => {
    const history = [turn("begin-1", "a".repeat(400)), turn("begin-2", "b".repeat(400))];
    const one = exchangeUsage(1000, history.slice(0, 1), "next question?");
    const two = exchangeUsage(1000, history, "next question?");
    expect(one.inputTokens).toBeGreaterThan(1000);
    expect(two.inputTokens - one.inputTokens).toBeGreaterThanOrEqual(100);
    expect(addUsage(one, two).calls).toBe(2);
  });

  it("prices a session from the settings file's per-million rates", () => {
    const prices = { inputPricePerMillionTokens: 4, outputPricePerMillionTokens: 20 };
    expect(estimateCost({ inputTokens: 250_000, outputTokens: 9_000, calls: 36 }, prices)).toBeCloseTo(1.18, 2);
    expect(formatCost(1.18)).toBe("$1.18");
    expect(formatCost(0.004)).toBe("under $0.01");
    expect(formatCost(0)).toBe("$0.00");
  });
});

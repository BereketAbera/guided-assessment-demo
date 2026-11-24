import { describe, expect, it } from "vitest";
import { matchesStem, reflect } from "@/lib/assessment/guide";
import { SCRIPT, SECOND_VOICE_ANSWERS } from "@/lib/assessment/script";
import type { Turn } from "@/lib/assessment/types";
import { addUsage, estimateCost, estimateTokens, exchangeUsage, formatCost } from "@/lib/assessment/usage";
import { dayInZone, longDate, shortDateTime } from "@/lib/format";
import { buildReport, firstSentence, supportingQuote } from "@/lib/report/build";
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

  it("does not count a word that is negated", () => {
    expect(matchesStem("I never plan my day", "plan")).toBe(false);
    expect(matchesStem("I do not keep a list", "list")).toBe(false);
    expect(matchesStem("I hate lists", "list")).toBe(false);
    expect(matchesStem("I don’t read the brief", "read")).toBe(false);
    expect(matchesStem("I am not calm", "calm")).toBe(false);
    // The "not" stops at the end of its sentence, and at "but".
    expect(matchesStem("I do not wait. I plan everything.", "plan")).toBe(true);
    expect(matchesStem("I never rush, but I do make a list", "list")).toBe(true);
    expect(matchesStem("We settled it there and then", "there and then")).toBe(true);
  });

  it("reflects an answer with the rule that fits best, or a neutral line", () => {
    const q = SCRIPT.find((s) => s.id === "others-2")!;
    expect(reflect(q, "I usually wait and think about it overnight.")).toMatch(/think before you answer/);
    expect(reflect(q, "It depends on the day.")).toBe(q.fallback);
  });

  it("does not say the opposite of what was written", () => {
    const first = SCRIPT.find((s) => s.id === "begin-1")!;
    const second = SCRIPT.find((s) => s.id === "begin-2")!;
    const pressure = SCRIPT.find((s) => s.id === "pressure-1")!;
    expect(reflect(first, "Honestly I never plan anything and I hate lists.")).toBe(first.fallback);
    expect(reflect(first, "I never plan my day and I do not keep a list of anything.")).toBe(first.fallback);
    expect(reflect(second, "I do not read the brief. I just start and fix it later.")).toMatch(/by starting/);
    expect(reflect(pressure, "I am not calm and I do not make lists. I panic for a day, then work through the weekend.")).toMatch(
      /another gear/,
    );
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
    // The summary names the two patterns as they are written in the rows below it.
    expect(report.profile.summary).toBe(
      "Across the five parts, two patterns came through most clearly in your own words: “Deliberate starter” and “Thinks before speaking.”",
    );
  });

  it("quotes the sentence that shows the pattern, in the person's own words", () => {
    expect(report.sections[2]?.quote).toBe("My colleague Dana gives me space.");
    // Not simply the first sentence of the part: the first one that carries the pattern.
    expect(report.sections[1]?.quote).toBe("I had a quiet afternoon with the door closed and my phone in a drawer.");
    expect(report.sections.every((s) => s.quote !== null)).toBe(true);
    expect(firstSentence("One. Two.")).toBe("One.");
    expect(firstSentence(`${"word ".repeat(60)}end`, 40).endsWith("…")).toBe(true);
  });

  it("never quotes a throwaway answer or a sentence that says the opposite", () => {
    const stems = ["plan", "list"];
    expect(supportingQuote(["Coffee.", "I wrote my plan in a notebook before opening my inbox."], stems)).toBe(
      "I wrote my plan in a notebook before opening my inbox.",
    );
    expect(supportingQuote(["Plan."], stems)).toBeNull();
    expect(supportingQuote(["Honestly I never plan anything and I hate lists."], stems)).toBeNull();
    expect(supportingQuote([], stems)).toBeNull();
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
    expect(flat.profile.traits[0]?.name).toBe("Begin: no clear lean");
  });

  it("claims nothing when the answers are throwaway", () => {
    const turns = SCRIPT.map((q, i) => turn(q.id, i % 2 === 0 ? "test" : "asdf"));
    const junk = buildReport({ firstName: "Sam", turns, closing: null, report: null }, 0);
    expect(junk.profile.name).toBe("No Clear Pattern Yet");
    expect(junk.profile.summary).toMatch(/did not lean strongly in any one direction/);
    expect(junk.profile.summary).not.toMatch(/came through/);
    expect(junk.keyStatement).not.toMatch(/You do your best work/);
    expect(junk.sections.every((s) => s.quote === null)).toBe(true);
    expect(junk.sections.every((s) => /did not lean clearly/.test(s.paragraphs[0]!))).toBe(true);
    expect(junk.nextSteps).toHaveLength(1);
  });

  it("does not print a pattern above a sentence that denies it", () => {
    const turns = [
      turn("begin-1", "Honestly I never plan anything and I hate lists. I just get going and see what happens."),
      turn("begin-2", "I never read the brief first."),
      turn("pressure-1", "I am not calm and I do not make lists. I panic for a day, then work through the weekend."),
    ];
    const own = buildReport({ firstName: "Sam", turns, closing: null, report: null }, 0);
    const [begin, , , pressure] = own.profile.traits;
    expect(begin?.name).not.toBe("Deliberate starter");
    expect(own.sections[0]?.paragraphs[0]).not.toMatch(/You begin by understanding/);
    expect(own.sections[0]?.quote).toBeNull();
    expect(pressure?.name).toBe("Sprints to the finish");
    expect(own.sections[3]?.quote).toBe("I panic for a day, then work through the weekend.");
    expect(own.profile.name).toBe("The Strong Finisher");
    expect(own.profile.summary).toMatch(/one pattern came through clearly in your own words: “Sprints to the finish.”$/);
    // Steps come only from parts that leaned.
    expect(own.nextSteps.map((s) => s.title)).toEqual(["Book the recovery with the sprint"]);
  });

  it("leaves a tied part neutral", () => {
    const tied = buildReport(
      { firstName: "Sam", turns: [turn("begin-1", "Sometimes I plan the whole thing, and sometimes I dive in before I know enough.")], closing: null, report: null },
      0,
    );
    expect(tied.profile.traits[0]).toMatchObject({ name: "Begin: no clear lean", score: 2 });
    expect(tied.sections[0]?.quote).toBeNull();
  });
});

describe("dates in the product's time zone", () => {
  it("puts an evening in the United States on that day, not the next", () => {
    const evening = Date.UTC(2026, 10, 25, 1, 30); // 8:30 PM on November 24 in New York
    expect(dayInZone(evening)).toBe("2026-11-24");
    expect(longDate(evening)).toBe("November 24, 2026");
    expect(longDate("2026-11-24")).toBe("November 24, 2026");
    expect(shortDateTime(evening)).toBe("Nov 24, 8:30 PM EST");
    const done = buildReport({ firstName: "Sam", turns: [], closing: null, report: null }, evening);
    expect(done.dateISO).toBe("2026-11-24");
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

import { describe, expect, it } from "vitest";
import { jobDurationMs, startJob, viewJob, type Stage } from "@/lib/assessment/job";

const stages: Stage[] = [
  { id: "reading", label: "Reading your answers", detail: "", seconds: 8 },
  { id: "profile", label: "Drawing your profile", detail: "", seconds: 9 },
  { id: "writing", label: "Writing your report", detail: "", seconds: 9 },
];
const T0 = 1_000_000;
const states = (at: number) => viewJob(startJob(stages, T0), stages, at).stages.map((s) => s.state);

describe("the staged report job", () => {
  it("lasts as long as its stages", () => {
    expect(jobDurationMs(stages)).toBe(26_000);
    expect(startJob(stages, T0)).toEqual({ startedAt: T0, readyAt: T0 + 26_000 });
  });

  it("moves through three named stages", () => {
    expect(states(T0)).toEqual(["active", "waiting", "waiting"]);
    expect(states(T0 + 7_999)).toEqual(["active", "waiting", "waiting"]);
    expect(states(T0 + 8_000)).toEqual(["done", "active", "waiting"]);
    expect(states(T0 + 17_000)).toEqual(["done", "done", "active"]);
    expect(states(T0 + 25_999)).toEqual(["done", "done", "active"]);
    expect(states(T0 + 26_000)).toEqual(["done", "done", "done"]);
  });

  it("reports the time left and when it is done", () => {
    const job = startJob(stages, T0);
    expect(viewJob(job, stages, T0 + 10_000)).toMatchObject({ done: false, stageIndex: 1, secondsLeft: 16 });
    expect(viewJob(job, stages, T0 + 25_500)).toMatchObject({ done: false, secondsLeft: 1 });
    expect(viewJob(job, stages, T0 + 60_000)).toMatchObject({ done: true, stageIndex: 3, secondsLeft: 0 });
  });

  it("gives the same answer to anyone who asks at the same moment (refresh, another device)", () => {
    const stored = JSON.parse(JSON.stringify(startJob(stages, T0))) as { startedAt: number; readyAt: number };
    expect(viewJob(stored, stages, T0 + 12_000)).toEqual(viewJob(startJob(stages, T0), stages, T0 + 12_000));
  });
});

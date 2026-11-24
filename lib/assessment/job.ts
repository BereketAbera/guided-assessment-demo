import type { Job } from "./types";

export type Stage = { id: string; label: string; detail: string; seconds: number };

export type JobView = {
  done: boolean;
  /** Index of the stage in progress; equals stages.length when done. */
  stageIndex: number;
  stages: { id: string; label: string; detail: string; state: "done" | "active" | "waiting" }[];
  secondsLeft: number;
  readyAt: number;
};

export function jobDurationMs(stages: Stage[]): number {
  return stages.reduce((sum, s) => sum + s.seconds, 0) * 1000;
}

export function startJob(stages: Stage[], now: number): Job {
  return { startedAt: now, readyAt: now + jobDurationMs(stages) };
}

/**
 * The stage a job has reached is a function of when it started and the clock.
 * Nothing about it lives in the browser, so a refresh, a closed tab or another
 * device all see the same stage. (In production a worker writes the stage to
 * the database; the page reads it the same way.)
 */
export function viewJob(job: Job, stages: Stage[], now: number): JobView {
  const elapsed = Math.max(0, now - job.startedAt);
  const done = now >= job.readyAt;
  let boundary = 0;
  let stageIndex = stages.length;
  for (let i = 0; i < stages.length; i++) {
    boundary += stages[i]!.seconds * 1000;
    if (elapsed < boundary) {
      stageIndex = i;
      break;
    }
  }
  if (done) stageIndex = stages.length;
  if (!done && stageIndex === stages.length) stageIndex = stages.length - 1;
  return {
    done,
    stageIndex,
    stages: stages.map((s, i) => ({
      id: s.id,
      label: s.label,
      detail: s.detail,
      state: i < stageIndex ? "done" : i === stageIndex ? "active" : "waiting",
    })),
    secondsLeft: done ? 0 : Math.max(1, Math.ceil((job.readyAt - now) / 1000)),
    readyAt: job.readyAt,
  };
}

import type { MachineConfig } from "@/lib/assessment/machine";
import { settings } from "@/lib/settings";

export const cfg: MachineConfig = {
  timeLimitDays: 14,
  reopenDays: 7,
  promptTokens: 300,
  stages: settings.reportJob.stages,
  parts: settings.parts,
};

export const T0 = Date.UTC(2026, 10, 24, 9, 0, 0);
export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;
export const LONG = "I plan the day in my notebook before I open anything else, and it usually takes twenty minutes.";

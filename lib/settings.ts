import settingsJson from "@/settings/assessment.settings.json";
import salesJson from "@/settings/sales-page.json";

/**
 * Everything the owner would change without touching code lives in /settings:
 * the model name and its prices, the selling prices, the parts and their
 * minutes, the stages of the report job, the sales copy and the prompt file.
 */
export const settings = settingsJson;
export const salesPage = salesJson;

export type PartSetting = (typeof settingsJson.parts)[number];
export type StageSetting = (typeof settingsJson.reportJob.stages)[number];

export const PART_COUNT = settings.parts.length;

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: settings.prices.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

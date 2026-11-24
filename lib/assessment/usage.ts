import type { Turn, Usage } from "./types";

/**
 * Token counts in this sample are estimated from text length (about four
 * characters a token). In production they are the usage figures the model's
 * API returns with every response, added up per session.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function turnTokens(t: Turn): number {
  return estimateTokens([t.reflection ?? "", t.question, t.answer ?? ""].join(" "));
}

/**
 * One exchange with a stateless API: the prompt and the whole conversation so
 * far go in, the reflection and the next question come out. Input grows with
 * every turn, which is why a long session costs more than its length suggests.
 */
export function exchangeUsage(promptTokens: number, history: Turn[], output: string): Usage {
  const inputTokens = promptTokens + history.reduce((sum, t) => sum + turnTokens(t), 0);
  return { inputTokens, outputTokens: estimateTokens(output), calls: 1 };
}

export function addUsage(a: Usage, b: Usage): Usage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    calls: a.calls + b.calls,
  };
}

export type ModelPrices = { inputPricePerMillionTokens: number; outputPricePerMillionTokens: number };

export function estimateCost(usage: Usage, prices: ModelPrices): number {
  return (
    (usage.inputTokens / 1_000_000) * prices.inputPricePerMillionTokens +
    (usage.outputTokens / 1_000_000) * prices.outputPricePerMillionTokens
  );
}

export function formatCost(dollars: number): string {
  if (dollars === 0) return "$0.00";
  if (dollars < 0.01) return "under $0.01";
  return "$" + dollars.toFixed(2);
}

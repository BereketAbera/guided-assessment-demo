import { markActive, repo, sandboxRef } from "@/lib/server/context";
import { handle, ok, readJson } from "@/lib/server/http";

/** Simulated checkout. No payment is taken; the codes land in the demo inbox. */
export function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const pack = body.pack === "twoPack" ? "twoPack" : "single";
    const result = await repo().purchase(await sandboxRef(), pack);
    await markActive();
    return ok(result);
  });
}

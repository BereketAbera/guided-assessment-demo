import { markActive, repo, sandboxRef } from "@/lib/server/context";
import { fail, handle, ok, readJson } from "@/lib/server/http";

/** Simulated checkout. No payment is taken; the codes land in the demo inbox. */
export function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    if (body.pack !== "single" && body.pack !== "twoPack") {
      return fail("unknown_pack", "Choose the single or the two-pack.", 400);
    }
    const result = await repo().purchase(await sandboxRef(), body.pack);
    await markActive();
    return ok(result);
  });
}

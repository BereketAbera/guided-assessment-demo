import { repo } from "@/lib/server/context";
import { fail, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Daily clean-up of sample data past its seven days. Callable only with the cron secret. */
export function GET(request: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
      return fail("forbidden", "Not allowed.", 401);
    }
    return ok(await repo().purge());
  });
}

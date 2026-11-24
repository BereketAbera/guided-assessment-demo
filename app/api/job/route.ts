import { currentSession } from "@/lib/server/context";
import { fail, handle, ok } from "@/lib/server/http";
import { jobViewOf } from "@/lib/server/views";

export const dynamic = "force-dynamic";

/** The waiting screen asks this every two seconds. The answer depends only on what the server has stored. */
export function GET() {
  return handle(async () => {
    const located = await currentSession();
    if (!located) return fail("no_session", "Enter your access code to see your report.", 401);
    const job = jobViewOf(located.record, Date.now());
    if (!job) return fail("not_ready", "There is no report in preparation for this code.", 409);
    return ok({ status: located.status, job });
  });
}

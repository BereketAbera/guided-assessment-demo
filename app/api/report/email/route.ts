import { repo, sessionPointer } from "@/lib/server/context";
import { fail, handle, ok } from "@/lib/server/http";

/** "Email me a copy": simulated. The message appears in the demo inbox. */
export function POST() {
  return handle(async () => {
    const pointer = await sessionPointer();
    if (!pointer) return fail("no_session", "Enter your access code first.", 401);
    await repo().emailCopy(pointer.ref, pointer.sessionId);
    return ok({ sent: true });
  });
}

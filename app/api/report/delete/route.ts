import { cookies } from "next/headers";
import { repo, SESSION_COOKIE, sessionPointer } from "@/lib/server/context";
import { fail, handle, ok } from "@/lib/server/http";

/** "Delete my answers": removes the first name, every answer and the report from the stored record. */
export function POST() {
  return handle(async () => {
    const pointer = await sessionPointer();
    if (!pointer) return fail("no_session", "Enter your access code first.", 401);
    await repo().deleteAnswers(pointer.ref, pointer.sessionId);
    (await cookies()).delete(SESSION_COOKIE);
    return ok({ deleted: true });
  });
}

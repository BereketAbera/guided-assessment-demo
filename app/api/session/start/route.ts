import { repo, sessionPointer } from "@/lib/server/context";
import { fail, handle, ok, readJson, text } from "@/lib/server/http";

export function POST(request: Request) {
  return handle(async () => {
    const pointer = await sessionPointer();
    if (!pointer) return fail("no_session", "Enter your access code first.", 401);
    const body = await readJson(request);
    await repo().start(pointer.ref, pointer.sessionId, text(body.firstName));
    return ok({ next: "/session" });
  });
}

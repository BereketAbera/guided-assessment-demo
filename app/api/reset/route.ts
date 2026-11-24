import { cookies } from "next/headers";
import { ACTIVE_COOKIE, ADMIN_COOKIE, repo, SANDBOX_COOKIE, sandboxRef, SESSION_COOKIE } from "@/lib/server/context";
import { handle, ok } from "@/lib/server/http";

/** Reset demo: deletes everything this visitor created and starts a new, empty space. */
export function POST() {
  return handle(async () => {
    await repo().reset(await sandboxRef());
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    jar.delete(ADMIN_COOKIE);
    jar.delete(SANDBOX_COOKIE);
    jar.delete(ACTIVE_COOKIE);
    return ok({ reset: true });
  });
}

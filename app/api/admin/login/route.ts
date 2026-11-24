import { cookies } from "next/headers";
import { ADMIN_COOKIE, cookieOptions, markActive, repo, sandboxRef } from "@/lib/server/context";
import { handle, ok } from "@/lib/server/http";

/**
 * Demo owner sign-in: one click, no password, and it only opens this
 * visitor's own sample space. The real product uses the owner's own account.
 */
export function POST() {
  return handle(async () => {
    const ref = await sandboxRef();
    await repo().mutate(ref, () => undefined);
    (await cookies()).set(ADMIN_COOKIE, ref, cookieOptions(4 * 60 * 60));
    await markActive();
    return ok({ signedIn: true });
  });
}

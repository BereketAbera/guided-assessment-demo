import { isAdmin, repo, sandboxRef } from "@/lib/server/context";
import { fail, handle, ok } from "@/lib/server/http";

export function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (!(await isAdmin())) return fail("not_signed_in", "Sign in as the owner first.", 401);
    const { id } = await context.params;
    await repo().reopen(await sandboxRef(), id);
    return ok({ reopened: true });
  });
}

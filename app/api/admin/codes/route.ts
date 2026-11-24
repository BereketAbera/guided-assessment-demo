import { isAdmin, repo, sandboxRef } from "@/lib/server/context";
import { fail, handle, ok, readJson, text } from "@/lib/server/http";

/** Create a code by hand. The full code is in this response only; the store keeps a one-way hash. */
export function POST(request: Request) {
  return handle(async () => {
    if (!(await isAdmin())) return fail("not_signed_in", "Sign in as the owner first.", 401);
    const body = await readJson(request);
    return ok(await repo().createCode(await sandboxRef(), text(body.note)));
  });
}

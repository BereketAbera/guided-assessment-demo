import { isAdmin, repo, sandboxRef } from "@/lib/server/context";
import { fail, handle, ok, readJson, text } from "@/lib/server/http";

/**
 * The only route that returns answers to the owner. It writes the access log
 * entry in the same step, so a transcript cannot be read without a record.
 */
export function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (!(await isAdmin())) return fail("not_signed_in", "Sign in as the owner first.", 401);
    const { id } = await context.params;
    const body = await readJson(request);
    const priv = await repo().openTranscript(await sandboxRef(), id, text(body.reason));
    if (!priv) return ok({ empty: true, firstName: null, turns: [] });
    return ok({
      empty: false,
      firstName: priv.firstName,
      turns: priv.turns
        .filter((t) => t.answer !== null)
        .map((t) => ({ questionId: t.questionId, partIndex: t.partIndex, question: t.question, answer: t.answer })),
    });
  });
}

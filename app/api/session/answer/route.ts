import { repo, sessionPointer } from "@/lib/server/context";
import { fail, handle, ok, readJson, text } from "@/lib/server/http";
import { conversationView, pathFor } from "@/lib/server/views";

/**
 * Saves one answer and returns the next question. The write happens before
 * the response, so "Saved" on screen always means stored on the server. When
 * the question was already answered elsewhere with other words, the outcome
 * is "superseded" and the screen says that this text was not saved.
 */
export function POST(request: Request) {
  return handle(async () => {
    const pointer = await sessionPointer();
    if (!pointer) return fail("no_session", "Enter your access code to continue.", 401);
    const body = await readJson(request);
    const { outcome, located } = await repo().answer(
      pointer.ref,
      pointer.sessionId,
      text(body.questionId),
      text(body.text),
    );
    if (located.status !== "in_progress") return ok({ outcome, finished: true, next: pathFor(located.status) });
    return ok({ outcome, finished: false, view: conversationView(located) });
  });
}

import { cookies } from "next/headers";
import { cookieOptions, encodePointer, repo, sandboxRef, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/server/context";
import { fail, handle, ok, readJson, text } from "@/lib/server/http";
import { pathFor } from "@/lib/server/views";

const longDate = (ms: number) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(ms);

/** Code entry. The code is the only thing needed to start, to resume and to reopen the report. */
export function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const located = await repo().locate(await sandboxRef(), text(body.code));
    if (!located) {
      return fail("not_found", "We can't find that code. Check it against your email, one character at a time.", 404);
    }
    const { record, status } = located;
    if (status === "deleted") {
      const when = record.meta.deletedAt ? ` on ${longDate(record.meta.deletedAt)}` : "";
      return fail("used", `This code has already been used, and its answers were deleted${when}. A code opens one assessment.`, 410);
    }
    if (status === "expired") {
      const when = record.meta.expiresAt ? ` on ${longDate(record.meta.expiresAt)}` : "";
      return fail(
        "expired",
        `The time limit for this code passed${when}. Nothing is lost: once it is reopened you continue from the same question.`,
        410,
      );
    }
    (await cookies()).set(SESSION_COOKIE, encodePointer({ ref: located.ref, sessionId: record.id }), cookieOptions(SESSION_MAX_AGE));
    return ok({ status, next: pathFor(status) });
  });
}

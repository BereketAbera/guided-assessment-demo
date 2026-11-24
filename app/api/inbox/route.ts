import { repo, sandboxRef, sessionPointer } from "@/lib/server/context";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => {
    const pointer = await sessionPointer();
    const messages = await repo().inbox(await sandboxRef(), pointer ?? undefined);
    return ok({ messages });
  });
}

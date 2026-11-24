import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server/context";
import { handle, ok } from "@/lib/server/http";

/** "Take a break" and "Close on this device": forget the session here. The answers stay on the server. */
export function POST() {
  return handle(async () => {
    (await cookies()).delete(SESSION_COOKIE);
    return ok({ left: true });
  });
}

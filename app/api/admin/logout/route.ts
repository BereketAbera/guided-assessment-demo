import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/server/context";
import { handle, ok } from "@/lib/server/http";

export function POST() {
  return handle(async () => {
    (await cookies()).delete(ADMIN_COOKIE);
    return ok({ signedIn: false });
  });
}

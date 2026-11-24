import { NextResponse, type NextRequest } from "next/server";
import { isLiveRef, isSandboxRef, newSandboxRef, RETENTION_DAYS } from "@/lib/sandbox-ref";

const SANDBOX_COOKIE = "ga_sb";

/**
 * Gives every visitor a private space before any page or API route runs, so
 * one visitor's codes and sessions are never listed to another.
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(SANDBOX_COOKIE)?.value;
  if (isSandboxRef(existing) && isLiveRef(existing, Date.now())) return NextResponse.next();

  const ref = newSandboxRef(Date.now());
  request.cookies.set(SANDBOX_COOKIE, ref);
  const headers = new Headers(request.headers);
  headers.set("cookie", request.cookies.toString());
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(SANDBOX_COOKIE, ref, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.GA_INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: RETENTION_DAYS * 24 * 60 * 60,
  });
  return response;
}

export const config = {
  // Pages and API routes only. Icons and the link-preview picture are left out, so a service that
  // fetches a pasted link's picture is not handed a visitor cookie.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image.png|api/cron).*)"],
};

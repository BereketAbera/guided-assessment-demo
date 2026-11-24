import "server-only";
import { NextResponse } from "next/server";
import { SessionError } from "@/lib/assessment/types";
import { RepoError } from "./repo";

export type ApiError = { error: { code: string; message: string } };

export function fail(code: string, message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

export function ok<T>(data: T) {
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}

/** Turns the errors the app expects into plain JSON a screen can show. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof SessionError) {
      // Input the server will not accept is a 400; a session in the wrong state is a 409; a lapsed one is gone.
      const invalid = error.code === "name_required" || error.code === "empty_answer" || error.code === "too_long";
      return fail(error.code, error.message, error.code === "expired" ? 410 : invalid ? 400 : 409);
    }
    if (error instanceof RepoError) {
      const status =
        error.code === "not_found"
          ? 404
          : error.code === "bad_code" || error.code === "reason_required"
            ? 400
            : error.code === "full"
              ? 409
              : 503;
      return fail(error.code, error.message, status);
    }
    console.error(error);
    return fail("server_error", "Something went wrong on our side. Your answers are safe; try again in a moment.", 500);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

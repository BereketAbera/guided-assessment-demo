import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Small JSON POST helper for the client. Network failures surface as { offline: true }. */
export async function postJson<T>(
  url: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; offline: boolean; code: string; message: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false, offline: true, code: "offline", message: "We couldn't reach the server." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    return {
      ok: false,
      offline: false,
      code: err?.code ?? "error",
      message: err?.message ?? "Something went wrong. Try again in a moment.",
    };
  }
  return { ok: true, data: data as T };
}

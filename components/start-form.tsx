"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/utils";
import { Button } from "./ui/button";

export function StartForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter your first name to begin.");
      return;
    }
    setBusy(true);
    const result = await postJson<{ next: string }>("/api/session/start", { firstName: name });
    if (!result.ok) {
      if (result.code === "already_started") {
        router.replace("/session");
        return;
      }
      setBusy(false);
      setError(result.offline ? "We couldn't reach the server. Check your connection and try again." : result.message);
      return;
    }
    router.push(result.data.next);
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="first-name" className="block text-sm font-semibold">
        Your first name
      </label>
      <input
        id="first-name"
        name="firstName"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        autoComplete="given-name"
        autoCapitalize="words"
        maxLength={40}
        aria-describedby={error ? "name-help name-error" : "name-help"}
        aria-invalid={error ? true : undefined}
        className="mt-2 block h-13 w-full rounded-lg border border-line bg-sand px-4 text-[1.0625rem] text-ink focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-pine"
      />
      <p id="name-help" className="mt-2 text-sm text-stone">
        Used to greet you and on the cover of your report. Nothing else is asked.
      </p>
      {error ? (
        <p id="name-error" role="alert" className="mt-3 rounded-lg border border-clay bg-white p-3 text-sm font-medium">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto sm:min-w-44" disabled={busy}>
        {busy ? "Starting…" : "Begin"}
      </Button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { checkCodeFormat, formatCode } from "@/lib/codes";
import { postJson } from "@/lib/utils";
import { Button } from "./ui/button";

type Problem = { code: string; message: string };

/** One field. Paste, spaces, dashes and lower case are all accepted and tidied as you type. */
export function CodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [lost, setLost] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prefill = () => {
      try {
        const stored = window.sessionStorage.getItem("ga:prefill");
        if (stored) {
          setValue(formatCode(stored));
          setProblem(null);
          window.sessionStorage.removeItem("ga:prefill");
          input.current?.focus();
        }
      } catch {
        // No storage: the visitor types the code.
      }
    };
    prefill();
    window.addEventListener("ga:prefill", prefill);
    return () => window.removeEventListener("ga:prefill", prefill);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const check = checkCodeFormat(value);
    if (!check.ok) {
      setProblem({ code: check.reason, message: check.message });
      input.current?.focus();
      return;
    }
    setBusy(true);
    setProblem(null);
    const result = await postJson<{ next: string }>("/api/code", { code: check.code });
    if (!result.ok) {
      setBusy(false);
      setProblem({
        code: result.code,
        message: result.offline ? "We couldn't reach the server. Check your connection and try again." : result.message,
      });
      input.current?.focus();
      return;
    }
    router.push(result.data.next);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8">
      <label htmlFor="code" className="block text-sm font-semibold">
        Access code
      </label>
      <input
        id="code"
        ref={input}
        name="code"
        value={value}
        onChange={(e) => {
          setValue(formatCode(e.target.value));
          setProblem(null);
        }}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        placeholder="XXXX-XXXX"
        aria-describedby={problem ? "code-help code-problem" : "code-help"}
        aria-invalid={problem ? true : undefined}
        className="mt-2 block h-16 w-full rounded-lg border border-line bg-sand px-4 text-center font-mono text-[1.75rem] font-semibold tracking-[0.18em] text-ink uppercase placeholder:font-normal placeholder:tracking-[0.18em] placeholder:text-line focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-pine"
      />
      <p id="code-help" className="mt-2 text-sm text-stone">
        Eight letters and numbers, from your email. Capitals, spaces and the dash don&apos;t matter.
      </p>

      {problem ? (
        <div id="code-problem" role="alert" className="mt-4 rounded-lg border border-clay bg-white p-4 text-[0.95rem]">
          <p className="font-semibold">
            {problem.code === "expired"
              ? "This code has expired"
              : problem.code === "used"
                ? "This code has already been used"
                : problem.code === "not_found"
                  ? "We can't find that code"
                  : "Check the code"}
          </p>
          <p className="mt-1">{problem.message}</p>
          {problem.code === "expired" ? (
            <p className="mt-2 text-sm text-stone">
              In the real product you would write to the owner. In this sample you can play the owner:{" "}
              <Link href="/admin" className="link">
                open the owner admin
              </Link>
              , reopen the session, then enter the code again.
            </p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
        {busy ? "Checking…" : "Continue"}
      </Button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
        <button
          type="button"
          onClick={() => setLost((v) => !v)}
          aria-expanded={lost}
          aria-controls="lost-code"
          className="link inline-flex min-h-11 items-center"
        >
          Lost your code?
        </button>
        <Link href="/sample-report" className="link inline-flex min-h-11 items-center">
          See a sample report
        </Link>
      </div>
      {lost ? (
        <p id="lost-code" className="rounded-lg bg-sand p-4 text-sm">
          Search your email for &ldquo;Your access code&rdquo;. In the real product this link sends your codes again to
          the address you bought with. In this sample, your codes are in the <strong>Demo inbox</strong> at the top of
          the page.
        </p>
      ) : null}
    </form>
  );
}

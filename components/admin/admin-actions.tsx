"use client";

import { Eye, KeyRound, LogIn, LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { settings } from "@/lib/settings";
import { postJson } from "@/lib/utils";
import { Button } from "../ui/button";

export function OwnerSignIn() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function signIn() {
    setBusy(true);
    const result = await postJson("/api/admin/login");
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      return;
    }
    router.refresh();
  }
  return (
    <div>
      <Button size="lg" onClick={signIn} disabled={busy}>
        <LogIn aria-hidden className="size-4" />
        {busy ? "Signing in…" : "Sign in as the demo owner"}
      </Button>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OwnerSignOut() {
  const router = useRouter();
  async function signOut() {
    await postJson("/api/admin/logout");
    router.push("/admin");
    router.refresh();
  }
  return (
    <Button variant="secondary" size="sm" onClick={signOut}>
      <LogOut aria-hidden className="size-4" />
      Sign out
    </Button>
  );
}

export function CreateCode() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ code: string; sessionId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await postJson<{ code: string; sessionId: string }>("/api/admin/codes", { note });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMade(result.data);
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-rule bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <KeyRound aria-hidden className="size-4 text-pine" />
        Create a code by hand
      </h2>
      <p className="mt-1 text-sm text-stone">For a gift, a tester or a customer whose email went astray.</p>
      <label htmlFor="code-note" className="mt-4 block text-sm font-semibold">
        Note (optional)
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <input
          id="code-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          placeholder="Who or what it is for"
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-[0.95rem] placeholder:text-stone focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-pine"
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create code"}
        </Button>
      </div>
      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-clay">
            {error}
          </p>
        ) : null}
        {made ? (
          <div className="mt-4 rounded-lg bg-sand p-4" data-testid="created-code">
            <p className="text-sm">
              New code for session <strong>{made.sessionId}</strong>. Copy it now: it is shown once, and only a one-way
              hash is stored.
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-[0.14em]">{made.code}</p>
          </div>
        ) : null}
      </div>
    </form>
  );
}

export function ReopenSession({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function reopen() {
    setBusy(true);
    const result = await postJson(`/api/admin/sessions/${id}/reopen`);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }
  return (
    <div>
      <Button onClick={reopen} disabled={busy}>
        <RotateCcw aria-hidden className="size-4" />
        {busy ? "Reopening…" : `Reopen for ${settings.assessment.reopenDays} days`}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Transcript = {
  empty: boolean;
  firstName: string | null;
  turns: { questionId: string; partIndex: number; question: string; answer: string }[];
};

const reasons = ["Customer asked for help with their report", "Checking a problem the customer reported", "Quality review during beta"];

/** Closed by default. Opening needs a reason, and the reason is written to the access log before anything is shown. */
export function TranscriptPanel({ id, hasAnswers }: { id: string; hasAnswers: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState(reasons[0]!);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await postJson<Transcript>(`/api/admin/sessions/${id}/transcript`, { reason });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setTranscript(result.data);
    router.refresh();
  }

  if (!hasAnswers) {
    return <p className="text-[0.95rem] text-stone">There is nothing to open: this session holds no answers.</p>;
  }

  if (transcript) {
    return (
      <div data-testid="transcript">
        <p className="rounded-lg border border-clay bg-white p-3 text-sm">
          <strong>Open.</strong> This view was recorded in the access log. Leaving or reloading the page closes it
          again.
        </p>
        <p className="mt-4 text-sm text-stone">First name given: {transcript.firstName}</p>
        <ol className="mt-3 space-y-5">
          {transcript.turns.map((t) => (
            <li key={t.questionId}>
              <p className="eyebrow">Part {t.partIndex + 1}</p>
              <p className="mt-0.5 font-serif font-semibold">{t.question}</p>
              <p className="mt-1 text-[0.95rem] whitespace-pre-wrap">{t.answer}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={open} data-testid="transcript-closed">
      <p className="text-[0.95rem]">
        The transcript is closed. This page was built without reading it. To open it, give a reason; the reason, the
        time and the session are written to the access log first.
      </p>
      <label htmlFor="reason" className="mt-4 block text-sm font-semibold">
        Reason for opening
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-[0.95rem] focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-pine"
        >
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={busy}>
          <Eye aria-hidden className="size-4" />
          {busy ? "Opening…" : "Open transcript"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-clay">
          {error}
        </p>
      ) : null}
    </form>
  );
}

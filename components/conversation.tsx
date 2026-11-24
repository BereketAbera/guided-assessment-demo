"use client";

import { Check, CloudOff, Coffee, ListChecks, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { SAMPLE_ANSWERS, SAMPLE_FOLLOW_UP_ANSWER } from "@/lib/assessment/script";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import type { ConversationView } from "@/lib/server/views";
import { settings } from "@/lib/settings";
import { cn, postJson } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

const MIN_READING_MS = 900;
const MAX_CHARS = 4000;

type AnswerResponse =
  | { outcome: string; finished: true; next: string }
  | { outcome: string; finished: false; view: ConversationView };

function clock(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(ms);
}

/**
 * The guided conversation: one question on the screen, a plain textarea for
 * the answer, and nothing that looks like a chat thread.
 */
export function Conversation({ initial }: { initial: ConversationView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"writing" | "saving" | "reading">("writing");
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const current = view.current;
  const questionId = current?.questionId ?? "";

  // Device facts are read after mount so the server and the browser render the same first page.
  useEffect(() => {
    setOnline(window.navigator.onLine);
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    if (initial.savedAt && initial.resumed) setSavedLabel(`Saved ${clock(initial.savedAt)}`);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [initial.savedAt, initial.resumed]);

  // A draft belongs to one question of one session and lives on this device until it is sent.
  useEffect(() => {
    setDraft(questionId ? loadDraft(window.localStorage, view.sessionId, questionId) : "");
  }, [view.sessionId, questionId]);

  const grow = useCallback(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);
  useEffect(grow, [draft, grow]);

  function onDraft(value: string) {
    setDraft(value);
    setError(null);
    saveDraft(window.localStorage, view.sessionId, questionId, value);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!current || phase !== "writing") return;
    if (!draft.trim()) {
      setError("Write an answer before you continue. A sentence or two is enough.");
      area.current?.focus();
      return;
    }
    if (!online) {
      setError("You're offline. Your answer is kept on this device; continue when you're back online.");
      return;
    }
    setError(null);
    setPhase("saving");
    const started = Date.now();
    const result = await postJson<AnswerResponse>("/api/session/answer", { questionId: current.questionId, text: draft });
    if (!result.ok) {
      setPhase("writing");
      if (result.code === "expired" || result.code === "no_session") {
        router.replace("/code");
        return;
      }
      setError(
        result.offline
          ? "We couldn't reach the server, so this answer isn't saved yet. It is still here; try again in a moment."
          : result.message,
      );
      return;
    }
    clearDraft(window.localStorage, view.sessionId, current.questionId);
    setSavedLabel(`Saved ${clock(Date.now())}`);
    setPhase("reading");
    const wait = Math.max(0, MIN_READING_MS - (Date.now() - started));
    await new Promise((resolve) => window.setTimeout(resolve, wait));
    if (result.data.finished) {
      router.push(result.data.next);
      return;
    }
    setView(result.data.view);
    setPhase("writing");
    window.requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    });
  }

  async function leave() {
    setLeaving(true);
    await postJson("/api/session/leave");
    router.push("/code?left=1");
  }

  if (!current) return null;

  const { progress } = view;
  const busy = phase !== "writing";
  const sample = current.kind === "followup" ? SAMPLE_FOLLOW_UP_ANSWER : (SAMPLE_ANSWERS[current.questionId] ?? "");

  return (
    <div className="mx-auto w-full max-w-[40rem] px-5 pt-5 pb-10 sm:pt-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone" data-testid="progress-text">
          <span className="font-semibold text-ink">
            Part {progress.partIndex + 1} of {progress.partCount}
          </span>{" "}
          · about {progress.minutesLeft} minutes left
        </p>
        <button
          type="button"
          onClick={() => setBreakOpen(true)}
          className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-pine hover:text-pine-deep"
        >
          <Coffee aria-hidden className="size-4" />
          Take a break
        </button>
      </div>
      <ol className="mt-1 flex gap-1.5" aria-label={`Part ${progress.partIndex + 1} of ${progress.partCount}`}>
        {settings.parts.map((part, i) => (
          <li
            key={part.id}
            aria-current={i === progress.partIndex ? "step" : undefined}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < progress.partIndex ? "bg-pine" : i === progress.partIndex ? "bg-pine/55" : "bg-rule",
            )}
          >
            <span className="sr-only">
              {part.title}: {i < progress.partIndex ? "done" : i === progress.partIndex ? "in progress" : "to come"}
            </span>
          </li>
        ))}
      </ol>

      {!online ? (
        <p role="status" className="mt-5 flex items-start gap-2.5 rounded-lg border border-clay bg-white p-3.5 text-sm">
          <CloudOff aria-hidden className="mt-0.5 size-4 shrink-0 text-clay" />
          <span>
            <span className="font-semibold">You&apos;re offline.</span> What you&apos;ve typed is kept on this device.
            Continue when your connection is back.
          </span>
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-8 sm:mt-12" noValidate>
        <div key={current.questionId} className="rise">
          <p className="eyebrow">{progress.partTitle}</p>
          {current.reflection ? (
            <p className="mt-4 border-l-2 border-clay pl-3.5 font-serif text-[1.05rem] leading-snug text-stone italic" data-testid="reflection">
              {current.reflection}
            </p>
          ) : (
            <p className="mt-4 border-l-2 border-clay pl-3.5 font-serif text-[1.05rem] leading-snug text-stone italic">
              {view.resumed ? `Welcome back, ${view.firstName}.` : `Welcome, ${view.firstName}. Let's begin where your day begins.`}
            </p>
          )}
          <h1
            ref={heading}
            tabIndex={-1}
            id="question"
            className="mt-4 font-serif text-[1.7rem] leading-[1.22] font-semibold tracking-tight outline-none sm:text-[2.15rem]"
          >
            {current.question}
          </h1>
        </div>

        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        <textarea
          id="answer"
          ref={area}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          readOnly={busy}
          rows={6}
          maxLength={MAX_CHARS}
          aria-describedby="answer-help"
          aria-invalid={error ? true : undefined}
          placeholder="Write as you would say it. There are no right answers."
          className={cn(
            "mt-6 block min-h-44 w-full resize-none rounded-lg border border-line bg-sand px-4 py-3.5 text-[1.0625rem] leading-relaxed text-ink placeholder:text-stone",
            "focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-pine",
            busy && "opacity-70",
          )}
        />
        <div id="answer-help" className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm text-stone">
          <p className="flex items-center gap-1.5">
            {touch ? (
              <>
                <Mic aria-hidden className="size-4 shrink-0" />
                Tap the microphone on your keyboard to speak.
              </>
            ) : (
              "Type, or use your device's dictation. You can edit until you continue."
            )}
          </p>
          {draft.length > MAX_CHARS - 400 ? <p>{MAX_CHARS - draft.length} characters left</p> : null}
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-clay bg-white p-3.5 text-sm font-medium text-ink">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-44" aria-disabled={busy || !online}>
            {phase === "saving" ? "Saving…" : phase === "reading" ? "Saved" : "Continue"}
          </Button>
          <p aria-live="polite" className="flex min-h-6 items-center gap-1.5 text-sm text-stone" data-testid="save-state">
            {phase === "reading" ? (
              <>
                <span aria-hidden className="breathe inline-block size-2 rounded-full bg-pine" />
                Reading your answer
              </>
            ) : savedLabel ? (
              <>
                <Check aria-hidden className="size-4 text-pine" />
                {savedLabel}
              </>
            ) : (
              "Each answer is saved when you continue."
            )}
          </p>
        </div>
      </form>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-rule pt-4 text-sm">
        <button
          type="button"
          onClick={() => setAnswersOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-pine hover:text-pine-deep"
        >
          <ListChecks aria-hidden className="size-4" />
          Your answers so far ({view.answers.length})
        </button>
        {sample ? (
          <button
            type="button"
            onClick={() => onDraft(sample)}
            disabled={busy}
            className="inline-flex min-h-11 items-center text-stone underline decoration-1 underline-offset-4 hover:text-ink"
          >
            Sample shortcut: fill an example answer
          </button>
        ) : null}
      </div>

      <Sheet
        open={answersOpen}
        onOpenChange={setAnswersOpen}
        title="Your answers so far"
        description="Saved under your access code. Sent answers are fixed; if something needs correcting, say so in your next answer."
      >
        {view.answers.length === 0 ? (
          <p className="text-sm text-stone">Nothing yet. Your first answer will appear here once you continue.</p>
        ) : (
          <ol className="space-y-6">
            {view.answers.map((a) => (
              <li key={a.questionId}>
                <p className="eyebrow">
                  Part {a.partIndex + 1} · {settings.parts[a.partIndex]?.title}
                </p>
                <p className="mt-1 font-serif text-[1.02rem] leading-snug font-semibold">{a.question}</p>
                <p className="mt-1.5 text-[0.95rem] whitespace-pre-wrap text-ink">{a.answer}</p>
              </li>
            ))}
          </ol>
        )}
      </Sheet>

      <Sheet
        open={breakOpen}
        onOpenChange={setBreakOpen}
        variant="dialog"
        title="Your place is kept"
        description={`Every answer you've sent is saved. Come back on any device with the same access code (it starts ${view.codeHint.slice(0, 4)}), and you'll return to this question.`}
      >
        <p className="text-sm text-stone">
          {draft.trim()
            ? "The answer you're still writing stays on this device only, until you continue."
            : "Leaving also closes the session on this device, which is useful on a shared computer."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => setBreakOpen(false)}>Keep going</Button>
          <Button variant="secondary" onClick={leave} disabled={leaving}>
            {leaving ? "Leaving…" : "Leave for now"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

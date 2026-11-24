"use client";

import { Mail } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, postJson } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

type Message = {
  id: string;
  at: number;
  kind: "access_codes" | "report_ready" | "report_copy" | "try_codes";
  subject: string;
  body: string;
  codes: { code: string; label: string }[];
  sessionId: string | null;
  openWith?: string;
};

export const INBOX_EVENT = "ga:inbox";

type InboxNews = { open?: boolean; added?: number };

/**
 * Tell the inbox something new has arrived (after a simulated purchase or "email me a copy").
 * `added` is how many new messages the caller knows about, so the count moves at once and
 * does not wait for the inbox to be read again.
 */
export function refreshInbox(news: InboxNews = {}) {
  window.dispatchEvent(new CustomEvent<InboxNews>(INBOX_EVENT, { detail: news }));
}

/**
 * Stands in for the buyer's mailbox. Nothing is emailed in this sample; what
 * the real product would send is listed here instead.
 */
export function DemoInbox() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Not known until the inbox has been read once: the badge shows no number before then, never a wrong 0.
  const [messages, setMessages] = useState<Message[] | null>(null);
  // Messages a purchase has just told us about, counted until the next read of the inbox includes them.
  const [arriving, setArriving] = useState(0);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const newest = useRef(0);

  const load = useCallback(async () => {
    const request = ++newest.current;
    try {
      const response = await fetch("/api/inbox", { cache: "no-store" });
      if (!response.ok) throw new Error("not ok");
      const data = (await response.json()) as { messages: Message[] };
      // A later request is already on its way; its answer is the one to show.
      if (request !== newest.current) return;
      setMessages(data.messages);
      setArriving(0);
      setFailed(false);
    } catch {
      // Offline: keep what is already shown.
      if (request === newest.current) setFailed(true);
    }
  }, []);

  // A visitor who has not bought or opened anything has an empty inbox: a known zero, with no need to ask the server.
  useEffect(() => {
    if (document.cookie.includes("ga_active=1")) void load();
    else setMessages((known) => known ?? []);
  }, [pathname, load]);

  useEffect(() => {
    const onEvent = (event: Event) => {
      const news = (event as CustomEvent<InboxNews>).detail ?? {};
      if (news.added) setArriving((n) => n + news.added!);
      void load();
      if (news.open) setOpen(true);
    };
    window.addEventListener(INBOX_EVENT, onEvent);
    return () => window.removeEventListener(INBOX_EVENT, onEvent);
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const count = messages === null ? null : messages.filter((m) => m.kind !== "try_codes").length + arriving;

  function enterCode(code: string) {
    try {
      window.sessionStorage.setItem("ga:prefill", code);
    } catch {
      // Without storage the visitor types the code; the page still works.
    }
    setOpen(false);
    router.push("/code");
    window.dispatchEvent(new Event("ga:prefill"));
  }

  /** What the link in the real email does: the code opens the report. */
  async function openReport(message: Message) {
    if (!message.openWith) return;
    setOpening(message.id);
    const result = await postJson<{ next: string }>("/api/code", { code: message.openWith });
    setOpening(null);
    setOpen(false);
    router.push(result.ok ? result.data.next : "/code");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 font-semibold text-ink hover:bg-paper pointer-coarse:min-h-11"
      >
        <Mail aria-hidden className="size-4" />
        Demo inbox
        {/* The badge keeps its place while the count is unknown, so nothing moves when the number arrives. */}
        <span
          data-testid="inbox-count"
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full bg-pine px-1.5 text-xs leading-5 font-semibold text-white",
            count === null && "invisible",
          )}
          aria-label={count === null ? undefined : `${count} message${count === 1 ? "" : "s"}`}
        >
          {count ?? "\u00a0"}
        </span>
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Demo inbox"
        description="Nothing is emailed in this sample. The messages the real product would send appear here."
      >
        {messages === null ? (
          <p role="status" className="mb-4 text-sm text-stone">
            {failed ? "We couldn't load the inbox. Close this panel and open it again to retry." : "Checking the inbox…"}
          </p>
        ) : arriving > 0 ? (
          <p role="status" className="mb-4 text-sm text-stone">
            A new message is arriving…
          </p>
        ) : count === 0 ? (
          <p className="mb-4 rounded-lg border border-dashed border-line p-4 text-sm text-stone">
            No messages yet. Make a simulated purchase on the sales page and your access code arrives here.
          </p>
        ) : null}
        <ul className="space-y-4">
          {(messages ?? []).map((m) => (
            <li
              key={m.id}
              className={
                m.kind === "try_codes"
                  ? "rounded-lg border border-dashed border-line p-4"
                  : "rounded-lg border border-rule bg-white p-4"
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{m.subject}</h3>
                {m.kind !== "try_codes" ? (
                  <time className="shrink-0 text-xs text-stone" dateTime={new Date(m.at).toISOString()}>
                    {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(m.at)}
                  </time>
                ) : (
                  <span className="shrink-0 text-xs font-semibold tracking-wide text-stone uppercase">Sample aid</span>
                )}
              </div>
              <p className="mt-1 text-sm text-stone">{m.body}</p>
              {m.codes.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {m.codes.map((c) => (
                    // Label, then the code, then its buttons: the same order in every row at every width.
                    <li key={c.code} data-testid="inbox-code-row" className="rounded-md bg-sand px-3 py-2.5">
                      <p className="text-xs text-stone">{c.label}</p>
                      <p className="font-mono text-lg font-semibold tracking-[0.12em]" data-testid="inbox-code">
                        {c.code}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => enterCode(c.code)}>
                          Use this code
                        </Button>
                        <CopyButton value={c.code} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {m.kind === "report_ready" || m.kind === "report_copy" ? (
                <div className="mt-3">
                  <p className="inline-block rounded bg-sand px-2 py-1 text-xs leading-snug font-semibold text-stone">
                    Attached in the real product: report PDF, resource PDFs
                  </p>
                  {m.openWith ? (
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={() => openReport(m)} disabled={opening !== null}>
                        {opening === m.id ? "Opening…" : "Open your report"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

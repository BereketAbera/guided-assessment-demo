"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
};

export const INBOX_EVENT = "ga:inbox";

/** Tell the inbox something new has arrived (after a simulated purchase or "email me a copy"). */
export function refreshInbox(open = false) {
  window.dispatchEvent(new CustomEvent(INBOX_EVENT, { detail: { open } }));
}

/**
 * Stands in for the buyer's mailbox. Nothing is emailed in this sample; what
 * the real product would send is listed here instead.
 */
export function DemoInbox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/inbox", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { messages: Message[] };
      setMessages(data.messages);
    } catch {
      // Offline: keep what is already shown.
    }
  }, []);

  useEffect(() => {
    void load();
    const onEvent = (event: Event) => {
      void load();
      if ((event as CustomEvent<{ open?: boolean }>).detail?.open) setOpen(true);
    };
    window.addEventListener(INBOX_EVENT, onEvent);
    return () => window.removeEventListener(INBOX_EVENT, onEvent);
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const count = messages.filter((m) => m.kind !== "try_codes").length;

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 font-semibold text-ink hover:bg-paper"
      >
        <Mail aria-hidden className="size-4" />
        Demo inbox
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full bg-pine px-1.5 text-xs leading-5 font-semibold text-white"
          aria-label={`${count} message${count === 1 ? "" : "s"}`}
        >
          {count}
        </span>
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Demo inbox"
        description="Nothing is emailed in this sample. The messages the real product would send appear here."
      >
        {count === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-4 text-sm text-stone">
            No messages yet. Make a simulated purchase on the sales page and your access code arrives here.
          </p>
        ) : null}
        <ul className="space-y-4">
          {messages.map((m) => (
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
                    <li
                      key={c.code}
                      data-testid="inbox-code-row"
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md bg-sand px-3 py-2"
                    >
                      <div>
                        <p className="text-xs text-stone">{c.label}</p>
                        <p className="font-mono text-lg font-semibold tracking-[0.12em]" data-testid="inbox-code">
                          {c.code}
                        </p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => enterCode(c.code)}>
                        Use this code
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {m.kind === "report_ready" || m.kind === "report_copy" ? (
                <p className="mt-3 text-sm">
                  <span className="rounded bg-sand px-2 py-1 text-xs font-semibold text-stone">
                    Attached in the real product: report PDF, resource PDFs
                  </span>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

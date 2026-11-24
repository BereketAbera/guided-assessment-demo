"use client";

import { Coffee } from "lucide-react";
import { useState } from "react";
import { postJson } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

function draftKeys(sessionId: string): string[] {
  try {
    return Object.keys(window.localStorage).filter((key) => key.startsWith(`ga:draft:${sessionId}:`));
  } catch {
    return [];
  }
}

/**
 * "Take a break": confirms the place is kept, and closes the session on this
 * device. Leaving is a full page load that replaces this page in the browser's
 * history, so the Back button cannot bring the conversation back.
 */
export function TakeBreak({ sessionId, codeStart }: { sessionId: string; codeStart: string }) {
  const [open, setOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function show() {
    setHasDraft(draftKeys(sessionId).length > 0);
    setOpen(true);
  }

  async function leave(removeDraft: boolean) {
    setLeaving(true);
    if (removeDraft) {
      try {
        for (const key of draftKeys(sessionId)) window.localStorage.removeItem(key);
      } catch {
        // Storage unavailable: there is no draft to remove.
      }
    }
    await postJson("/api/session/leave");
    window.location.replace("/code?left=1");
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-pine hover:text-pine-deep"
      >
        <Coffee aria-hidden className="size-4" />
        Take a break
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        variant="dialog"
        title="Your place is kept"
        description={`Every answer you've sent is saved. Come back on any device with the same access code (it starts ${codeStart}), and you'll return to this question.`}
      >
        <p className="text-sm text-stone">
          {hasDraft
            ? "The answer you're still writing has not been sent. It stays in this browser only, so on a shared computer remove it as you leave."
            : "Leaving also closes the session on this device, which is useful on a shared computer."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => setOpen(false)}>Keep going</Button>
          <Button variant="secondary" onClick={() => leave(false)} disabled={leaving}>
            {leaving ? "Leaving…" : "Leave for now"}
          </Button>
          {hasDraft ? (
            <Button variant="secondary" onClick={() => leave(true)} disabled={leaving}>
              Leave and remove what I was typing
            </Button>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}

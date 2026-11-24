"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { postJson } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

export function ResetDemo() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    await postJson("/api/reset");
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("ga:")) window.localStorage.removeItem(key);
      }
      window.sessionStorage.removeItem("ga:prefill");
    } catch {
      // Storage can be unavailable in private modes; nothing to clear then.
    }
    window.location.assign("/");
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw aria-hidden className="size-4" />
        Reset demo
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        variant="dialog"
        title="Reset this sample?"
        description="This deletes the codes, sessions, answers and inbox created in this browser, and starts a fresh sample space."
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={reset} disabled={busy}>
            {busy ? "Resetting…" : "Delete and start again"}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </>
  );
}

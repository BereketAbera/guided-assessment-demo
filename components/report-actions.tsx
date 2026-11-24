"use client";

import { Download, Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { refreshInbox } from "./demo-inbox";
import { postJson } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet } from "./ui/sheet";

export function ReportToolbar() {
  const [mail, setMail] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function email() {
    setMail("sending");
    const result = await postJson("/api/report/email");
    setMail(result.ok ? "sent" : "failed");
    if (result.ok) refreshInbox();
  }

  return (
    <div className="no-print mx-auto mb-6 w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => window.print()}>
          <Download aria-hidden className="size-4" />
          Save as PDF
        </Button>
        <Button variant="secondary" onClick={email} disabled={mail === "sending"}>
          <Mail aria-hidden className="size-4" />
          {mail === "sending" ? "Sending…" : "Email me a copy"}
        </Button>
      </div>
      <p className="mt-2 text-sm text-stone" aria-live="polite" data-testid="mail-state">
        {mail === "sent"
          ? "Sent. In this sample the copy is in the Demo inbox at the top of the page."
          : mail === "failed"
            ? "We couldn't send that just now. Try again in a moment."
            : "Save as PDF opens your print dialog; choose “Save as PDF” as the destination. The PDF is this page, in the same layout."}
      </p>
    </div>
  );
}

export function DeleteAnswers() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const result = await postJson("/api/report/delete");
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      return;
    }
    // A full page load that replaces this page in the browser's history: the Back button cannot show the report again.
    window.location.replace("/code?deleted=1");
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden className="size-4" />
        Delete my answers
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        variant="dialog"
        title="Delete your answers and report?"
        description="Your first name, every answer and this report are removed from our records now. This can't be undone, and the code can't be used again. Save it as a PDF first if you want to keep it."
      >
        {error ? (
          <p role="alert" className="mb-4 rounded-lg border border-clay bg-white p-3 text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? "Deleting…" : "Delete everything"}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Keep my report
          </Button>
        </div>
      </Sheet>
    </>
  );
}

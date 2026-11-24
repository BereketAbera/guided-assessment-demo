"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonStyles } from "./ui/button";

/** Copies a code to the clipboard and says so. Falls back to selecting nothing when the browser refuses. */
export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await window.navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button type="button" onClick={copy} className={cn(buttonStyles({ variant: "secondary", size: "sm" }), className)}>
      {state === "copied" ? <Check aria-hidden className="size-4 text-pine" /> : <Copy aria-hidden className="size-4" />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy it" : label}</span>
      <span className="sr-only"> code {value}</span>
    </button>
  );
}

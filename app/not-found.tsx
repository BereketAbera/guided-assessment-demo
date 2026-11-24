import type { Metadata } from "next";
import Link from "next/link";
import { FlowShell } from "@/components/flow-shell";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <FlowShell>
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">There is nothing at this address</h1>
      <p className="mt-3 text-lg">If you were in the middle of an assessment, your answers are safe. Your code takes you back.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/code" className={buttonStyles()}>
          Enter your code
        </Link>
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          Go to the sales page
        </Link>
      </div>
    </FlowShell>
  );
}

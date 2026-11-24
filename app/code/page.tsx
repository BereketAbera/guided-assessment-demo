import type { Metadata } from "next";
import Link from "next/link";
import { CodeForm } from "@/components/code-form";
import { FlowShell } from "@/components/flow-shell";
import { currentSession } from "@/lib/server/context";
import { pathFor, statusLabel } from "@/lib/server/views";

export const metadata: Metadata = { title: "Enter your access code" };

export default async function CodePage({ searchParams }: { searchParams: Promise<{ left?: string; deleted?: string }> }) {
  const params = await searchParams;
  const open = await currentSession();
  const resumable = open && open.status !== "expired" && open.status !== "deleted" ? open : null;

  return (
    <FlowShell>
      {params.left ? (
        <p role="status" className="mb-8 rounded-lg border border-pine bg-white p-4 text-[0.95rem]">
          <span className="font-semibold">Your place is kept.</span> The session is closed on this device. Enter the
          same code, here or on another device, to return to the question you were on.
        </p>
      ) : null}
      {params.deleted ? (
        <p role="status" className="mb-8 rounded-lg border border-pine bg-white p-4 text-[0.95rem]">
          <span className="font-semibold">Your answers and report have been deleted.</span> Nothing you wrote remains
          in our records. The code can&apos;t be used again.
        </p>
      ) : null}

      <p className="eyebrow">The Working Style Reflection</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">Enter your access code</h1>
      <p className="mt-3 text-lg">
        Your code starts the assessment, brings you back if you stop partway, and opens your report afterwards.
      </p>

      {resumable ? (
        <p className="mt-6 rounded-lg bg-sand p-4 text-[0.95rem]">
          A session is already open on this device ({statusLabel(resumable.status, resumable.record.meta.partIndex).toLowerCase()}).{" "}
          <Link href={pathFor(resumable.status)} className="link">
            Continue where you left off
          </Link>
        </p>
      ) : null}

      <CodeForm />

      <p className="mt-10 border-t border-rule pt-5 text-sm text-stone">
        No code yet? In this sample, the{" "}
        <Link href="/#buy" className="link">
          sales page
        </Link>{" "}
        has a simulated purchase, and the Demo inbox at the top of the page holds three ready-made codes once you have
        made one.
      </p>
    </FlowShell>
  );
}

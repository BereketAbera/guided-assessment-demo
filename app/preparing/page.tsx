import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlowShell } from "@/components/flow-shell";
import { Preparing } from "@/components/preparing";
import { currentSession } from "@/lib/server/context";
import { Repo } from "@/lib/server/repo";
import { jobViewOf, pathFor } from "@/lib/server/views";

export const metadata: Metadata = { title: "Preparing your results" };

export default async function PreparingPage() {
  const located = await currentSession();
  if (!located) redirect("/code");
  if (located.status !== "preparing") redirect(pathFor(located.status));
  const job = jobViewOf(located.record, Date.now());
  if (!job) redirect("/session");
  const priv = Repo.open(located.record).priv;

  return (
    <FlowShell>
      <p className="eyebrow">The Working Style Reflection</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">Preparing your results</h1>
      {priv?.closing ? (
        <p className="mt-4 border-l-2 border-clay pl-3.5 font-serif text-[1.05rem] leading-snug text-stone italic">
          {priv.closing}
        </p>
      ) : null}
      <p className="mt-4 text-lg">
        Your report is being written now{priv?.firstName ? `, ${priv.firstName}` : ""}. It is made for you, so it
        takes a little while.
      </p>

      <Preparing initial={job} />

      <div className="mt-6 space-y-3 text-[0.95rem]">
        <p>
          <strong>You can close this page.</strong> The report is prepared on our side, not in your browser. We&apos;ll
          email it when it&apos;s ready, and your access code opens it at any time.
        </p>
        <p className="text-stone">
          About this sample: the wait here is about 25 seconds. The real report takes one to two minutes, and this
          screen works the same way for it.
        </p>
      </div>
    </FlowShell>
  );
}

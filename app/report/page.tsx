import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeleteAnswers, ReportToolbar } from "@/components/report-actions";
import { ReportView } from "@/components/report/report-view";
import { FlowShell } from "@/components/flow-shell";
import { RETENTION_DAYS } from "@/lib/sandbox-ref";
import { currentSession } from "@/lib/server/context";
import { Repo } from "@/lib/server/repo";
import { pathFor } from "@/lib/server/views";

export const metadata: Metadata = { title: "Your report" };

export default async function ReportPage() {
  const located = await currentSession();
  if (!located) redirect("/code");
  if (located.status !== "report_ready") redirect(pathFor(located.status));
  const report = Repo.open(located.record).priv?.report;
  if (!report) redirect("/code");

  return (
    <FlowShell wide>
      <ReportToolbar />
      <p className="no-print mx-auto mb-6 w-full max-w-3xl rounded-lg border border-dashed border-line px-3.5 py-2.5 text-[0.8125rem] leading-snug text-stone" data-testid="sample-note">
        <span className="font-semibold text-ink">Sample.</span> This report is assembled by simple rules from words in
        your answers, not written by a model, so it may not match what you wrote. In the real build the model writes it
        from your prompt, into this same layout.
      </p>
      <ReportView report={report} />

      <section aria-labelledby="your-data" className="no-print mx-auto mt-8 w-full max-w-3xl rounded-xl border border-rule bg-sand/70 p-6 sm:p-8">
        <h2 id="your-data" className="font-serif text-2xl font-semibold">
          Your answers, and who can read them
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 text-[0.95rem] sm:grid-cols-3">
          <div>
            <dt className="font-semibold">What is stored</dt>
            <dd className="mt-1">
              In this sample: your first name, your answers and this report, encrypted, and no email. The real product
              also keeps the email you bought with, to send your code and report.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">For how long</dt>
            <dd className="mt-1">
              Until you delete them. In this sample, everything is also removed after {RETENTION_DAYS} days.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Who can read them</dt>
            <dd className="mt-1">
              You, with your code. The owner only by opening your session on purpose, which is logged each time.
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#d9cfbe] pt-5">
          <DeleteAnswers />
          <p className="text-sm text-stone">Removes your name, answers and report now. It can&apos;t be undone.</p>
        </div>
      </section>
    </FlowShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { FlowShell } from "@/components/flow-shell";
import { ReportView } from "@/components/report/report-view";
import { buttonStyles } from "@/components/ui/button";
import { sampleReport } from "@/lib/report/sample";

export const metadata: Metadata = { title: "Sample report" };

export default function SampleReportPage() {
  return (
    <FlowShell wide>
      <div className="no-print mx-auto mb-6 flex w-full max-w-3xl flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-[0.95rem] text-stone">
          A full report for an invented person, Maren. Every report uses this layout; the words come from the answers.
        </p>
        <Link href="/#buy" className={buttonStyles({ variant: "secondary" })}>
          Back to the sales page
        </Link>
      </div>
      <ReportView report={sampleReport()} sample />
    </FlowShell>
  );
}

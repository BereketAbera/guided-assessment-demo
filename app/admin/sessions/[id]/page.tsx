import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReopenSession, TranscriptPanel } from "@/components/admin/admin-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { SiteHeader } from "@/components/site-header";
import { formatCost } from "@/lib/assessment/usage";
import { number, shortDateTime } from "@/lib/format";
import { isAdmin, repo, sandboxRef } from "@/lib/server/context";
import { adminRow } from "@/lib/server/views";
import { settings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: /^S-\d{1,8}$/.test(id) ? `Session ${id}` : "Session" };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-stone">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

export default async function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const located = await repo().get(await sandboxRef(), id);
  if (!located) notFound();
  // Built from the plain half of the record. The sealed answers are not opened here.
  const row = adminRow(located.record, located.status);
  const when = (ms: number | null) => (ms ? shortDateTime(ms) : "Not yet");

  return (
    <>
      <SiteHeader variant="owner" current="/admin" />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <Link href="/admin" className="link inline-flex min-h-11 items-center gap-1.5 text-sm">
          <ArrowLeft aria-hidden className="size-4" />
          All codes and sessions
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight">Session {row.id}</h1>
          <StatusBadge status={row.status} label={row.statusLabel} />
        </div>
        {/* An example row's note describes how it was made; once the session is reopened it no longer holds. */}
        {row.note && !(row.source === "seed" && row.reopenedAt) ? <p className="mt-1 text-stone">{row.note}</p> : null}

        {row.status === "expired" ? (
          <div className="mt-6 rounded-xl border border-clay bg-white p-5">
            <p className="font-semibold">This session ran past its time limit on {when(row.expiresAt)}.</p>
            <p className="mt-1 text-[0.95rem]">
              Reopening gives the customer {settings.assessment.reopenDays} more days. Their answers are kept, and their
              code takes them back to the question they were on.
            </p>
            <div className="mt-4">
              <ReopenSession id={row.id} days={settings.assessment.reopenDays} />
            </div>
          </div>
        ) : null}
        {row.reopenedAt ? (
          <p className="mt-6 rounded-lg border border-pine bg-white p-4 text-[0.95rem]" data-testid="reopened-note">
            Reopened on {when(row.reopenedAt)}. Open until {when(row.expiresAt)}.
          </p>
        ) : null}

        <section aria-labelledby="facts" className="mt-6 rounded-xl border border-rule bg-white p-5 sm:p-6">
          <h2 id="facts" className="font-semibold">
            Status and dates
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
            <Fact label="Code">
              <span className="font-mono tracking-wider">{row.codeHint}</span>
            </Fact>
            <Fact label="Created">{when(row.createdAt)}</Fact>
            <Fact label="Started">{when(row.startedAt)}</Fact>
            <Fact label="Last activity">{when(row.lastActivityAt)}</Fact>
            {row.status === "deleted" ? (
              <>
                <Fact label="Answers deleted">{when(row.deletedAt)}</Fact>
                <Fact label="Report">Deleted with the answers</Fact>
              </>
            ) : (
              <>
                <Fact label={row.status === "expired" ? "Expired" : "Time limit"}>
                  {row.expiresAt ? when(row.expiresAt) : "Starts when the assessment is started"}
                </Fact>
                <Fact label="Report ready">
                  {row.status === "report_ready" ? when(row.reportReadyAt) : row.status === "preparing" ? "Being prepared" : "Not yet"}
                </Fact>
              </>
            )}
          </dl>
        </section>

        <section aria-labelledby="cost" className="mt-6 rounded-xl border border-rule bg-white p-5 sm:p-6">
          <h2 id="cost" className="font-semibold">
            AI usage and estimated cost
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-4">
            <Fact label="Model calls">{number(row.calls)}</Fact>
            <Fact label="Tokens in">{number(row.inputTokens)}</Fact>
            <Fact label="Tokens out">{number(row.outputTokens)}</Fact>
            <Fact label="Estimated cost">{formatCost(row.cost)}</Fact>
          </dl>
          <p className="mt-4 text-sm text-stone">
            {number(row.inputTokens)} × ${settings.model.inputPricePerMillionTokens} + {number(row.outputTokens)} × $
            {settings.model.outputPricePerMillionTokens}, per million tokens, on{" "}
            <span className="font-mono">{settings.model.name}</span>. Tokens in are much larger than tokens out because
            every call sends the whole conversation so far.
            {row.source === "seed" ? " This is an invented example with the counts of a full-length conversation." : ""}
          </p>
        </section>

        <section aria-labelledby="transcript" className="mt-6 rounded-xl border border-rule bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="transcript" className="font-semibold">
              Transcript
            </h2>
            <p className="text-sm text-stone" data-testid="open-count">
              Opened {row.transcriptOpens} time{row.transcriptOpens === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-3">
            <TranscriptPanel id={row.id} hasAnswers={located.record.sealed !== null} />
          </div>
        </section>
      </main>
    </>
  );
}

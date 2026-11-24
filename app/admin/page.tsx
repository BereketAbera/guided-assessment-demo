import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateCode, OwnerSignIn, OwnerSignOut } from "@/components/admin/admin-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { SiteHeader } from "@/components/site-header";
import { statusOf } from "@/lib/assessment/machine";
import { formatCost } from "@/lib/assessment/usage";
import { ago, number, shortDateTime } from "@/lib/format";
import { isAdmin, repo, sandboxRef } from "@/lib/server/context";
import { adminRow } from "@/lib/server/views";
import { settings } from "@/lib/settings";

export const metadata: Metadata = { title: "Owner admin" };
export const dynamic = "force-dynamic";

const sourceLabel = { purchase: "Purchase", manual: "By hand", seed: "Example" } as const;
const actionLabel = {
  code_created: "Code created",
  purchase_simulated: "Purchase",
  transcript_opened: "Transcript opened",
  session_reopened: "Session reopened",
  answers_deleted: "Answers deleted",
} as const;

export default async function AdminPage() {
  const signedIn = await isAdmin();

  if (!signedIn) {
    return (
      <>
        <SiteHeader variant="owner" current="/admin" />
        <main id="main" className="mx-auto w-full max-w-xl flex-1 px-5 py-14 sm:py-20">
          <p className="eyebrow">Owner admin</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">Sign in</h1>
          <p className="mt-3 text-lg">
            The admin area is where the owner sees codes, sessions and the AI cost of each, creates a code by hand and
            reopens a session that ran out of time.
          </p>
          <div className="mt-7 rounded-xl border border-rule bg-white p-6">
            <p className="font-semibold">Demo owner</p>
            <p className="mt-1 text-[0.95rem] text-stone">
              One click, no password. It opens the admin for your own private copy of this sample, with invented
              example sessions. The real product uses the owner&apos;s own sign-in.
            </p>
            <div className="mt-5">
              <OwnerSignIn />
            </div>
          </div>
        </main>
      </>
    );
  }

  const now = Date.now();
  const doc = await repo().read(await sandboxRef());
  const rows = (doc?.sessions ?? [])
    .map((s) => adminRow(s, statusOf(s.meta, now)))
    .sort((a, b) => (b.lastActivityAt ?? b.createdAt) - (a.lastActivityAt ?? a.createdAt));
  const audit = doc?.audit ?? [];
  const spent = rows.reduce((sum, r) => sum + r.cost, 0);
  const zone = settings.assessment.timeZone.replace(/_/g, " ");

  return (
    <>
      <SiteHeader variant="owner" current="/admin" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Owner admin</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight font-semibold tracking-tight">Codes and sessions</h1>
          </div>
          <OwnerSignOut />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-rule bg-white p-4">
            <dt className="text-sm text-stone">Model, from the settings file</dt>
            <dd className="mt-1 font-mono text-[0.95rem] font-semibold" data-testid="model-name">
              {settings.model.name}
            </dd>
          </div>
          <div className="rounded-xl border border-rule bg-white p-4">
            <dt className="text-sm text-stone">Price per million tokens</dt>
            <dd className="mt-1 font-semibold">
              ${settings.model.inputPricePerMillionTokens} in · ${settings.model.outputPricePerMillionTokens} out
            </dd>
          </div>
          <div className="rounded-xl border border-rule bg-white p-4">
            <dt className="text-sm text-stone">Sessions and codes</dt>
            <dd className="mt-1 font-semibold">{rows.length}</dd>
          </div>
          <div className="rounded-xl border border-rule bg-white p-4">
            <dt className="text-sm text-stone">Estimated AI cost, all sessions</dt>
            <dd className="mt-1 font-semibold">{formatCost(spent)}</dd>
          </div>
        </dl>

        <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-sand p-4 text-[0.95rem]">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-pine" />
          <span>
            This table is built from each session&apos;s status, dates and token counts only. No answer is read to draw
            it. A transcript stays closed until you open it from the session&apos;s page, and that is logged below.
          </span>
        </p>

        <section aria-labelledby="sessions-heading" className="mt-8">
          <h2 id="sessions-heading" className="sr-only">
            Sessions
          </h2>
          {/* A phone gets one card per session; a tablet gets the table, which is wider than its screen. */}
          <p className="mb-2 hidden text-sm text-stone sm:block lg:hidden">Swipe the table sideways for tokens and cost.</p>
          <div className="overflow-x-auto rounded-xl border border-rule bg-white" tabIndex={0} role="region" aria-label="Sessions table">
            <table className="stack-table stack-pairs w-full border-collapse text-left text-[0.9rem] sm:min-w-[56rem]">
              <thead>
                <tr className="border-b border-rule text-xs tracking-wide text-stone uppercase">
                  <th scope="col" className="px-4 py-3 font-semibold">Session</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last activity</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold whitespace-nowrap">Tokens in</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold whitespace-nowrap">Tokens out</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold whitespace-nowrap">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-rule last:border-b-0 hover:bg-paper" data-testid="session-row">
                    <th scope="row" className="px-4 py-3 align-top font-semibold">
                      <Link href={`/admin/sessions/${r.id}`} className="link">
                        {r.id}
                      </Link>
                      <span className="block text-xs font-normal text-stone">
                        {sourceLabel[r.source]}
                        {r.note ? ` · ${r.note}` : ""}
                      </span>
                    </th>
                    <td data-label="Code" className="px-4 py-3 align-top font-mono tracking-wider whitespace-nowrap max-sm:order-3">
                      {r.codeHint}
                    </td>
                    <td data-label="Status" className="px-4 py-3 align-top max-sm:order-1">
                      <StatusBadge status={r.status} label={r.statusLabel} />
                    </td>
                    <td data-label="Last activity" className="px-4 py-3 align-top whitespace-nowrap max-sm:order-4">
                      {r.lastActivityAt ? (
                        <>
                          {ago(r.lastActivityAt, now)}
                          <span className="block text-xs text-stone">{shortDateTime(r.lastActivityAt)}</span>
                        </>
                      ) : (
                        <span className="text-stone">None yet</span>
                      )}
                    </td>
                    <td data-label="Tokens in" className="px-4 py-3 text-right align-top tabular-nums max-sm:order-5">
                      {number(r.inputTokens)}
                    </td>
                    <td data-label="Tokens out" className="px-4 py-3 text-right align-top tabular-nums max-sm:order-6">
                      {number(r.outputTokens)}
                    </td>
                    <td data-label="Est. cost" className="px-4 py-3 text-right align-top font-semibold tabular-nums max-sm:order-2">
                      {formatCost(r.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-4xl text-sm text-stone">
            Cost is an estimate: tokens in and out multiplied by the prices in the settings file. In this sample, token
            counts are estimated from text length; the real product adds up the usage figures returned with every
            model response. The rows marked Example are invented and carry the counts of a full-length conversation; a
            session you run here is much shorter. The example counts are before prompt caching, which lowers the input
            cost, and do not include the model&apos;s thinking tokens, which are billed as output. The real figure
            comes from a test run with your prompt. Times are shown in {zone}, set in the settings file.
          </p>
        </section>

        <section aria-labelledby="later-heading" className="mt-8 rounded-xl border border-dashed border-line p-5 sm:p-6">
          <h2 id="later-heading" className="font-semibold">
            Not in this sample, in the real build
          </h2>
          <p className="mt-1 max-w-4xl text-sm text-stone">
            The brief&apos;s admin list has ten items. This page shows five: codes, sessions, cost per session, creating
            a code and reopening a session. The other five:
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-3 text-[0.93rem] md:grid-cols-2">
            <div>
              <dt className="font-semibold">Reports</dt>
              <dd>Opened by the owner through the same logged step as a transcript, reason first.</dd>
            </div>
            <div>
              <dt className="font-semibold">Feedback</dt>
              <dd>Customer and beta feedback, listed against the session it came from.</dd>
            </div>
            <div>
              <dt className="font-semibold">Refunds</dt>
              <dd>A Refund button on the session: it calls the payment provider and retires the code.</dd>
            </div>
            <div>
              <dt className="font-semibold">Prices</dt>
              <dd>Edited here, and used by checkout from the next sale on.</dd>
            </div>
            <div>
              <dt className="font-semibold">Beta mode</dt>
              <dd>Invited testers, a debrief form after the report, and CSV exports.</dd>
            </div>
          </dl>
        </section>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_1.25fr]">
          <CreateCode />
          <section aria-labelledby="log-heading" className="rounded-xl border border-rule bg-white p-5">
            <h2 id="log-heading" className="font-semibold">
              Access log
            </h2>
            <p className="mt-1 text-sm text-stone">Who did what, newest first. Opening a transcript always appears here.</p>
            <ol className="mt-4 divide-y divide-rule text-[0.9rem]" data-testid="access-log">
              {audit.map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[10.5rem_1fr]">
                  <span className="text-xs text-stone sm:pt-0.5">{shortDateTime(entry.at)}</span>
                  <span>
                    <span className="font-semibold">
                      {actionLabel[entry.action]}
                      {entry.sessionId ? ` · ${entry.sessionId}` : ""}
                    </span>{" "}
                    <span className="text-stone">by the {entry.actor === "system" ? "system" : entry.actor}</span>
                    <span className="block">{entry.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </>
  );
}

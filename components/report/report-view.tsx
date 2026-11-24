import { FileText } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { longDate } from "@/lib/format";
import type { Report } from "@/lib/report/types";
import { settings } from "@/lib/settings";
import { ProfileFigure } from "./profile-figure";

function Dots({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${score} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= score ? "size-2.5 rounded-full bg-pine" : "size-2.5 rounded-full border border-line bg-paper"}
        />
      ))}
    </span>
  );
}

/**
 * The one report template. The on-screen report, the PDF (this page printed)
 * and the sample report all render through it, from the same labeled fields.
 */
export function ReportView({ report, sample = false }: { report: Report; sample?: boolean }) {
  return (
    <article className="print-flat mx-auto w-full max-w-3xl rounded-xl border border-rule bg-white px-6 py-10 shadow-sm sm:px-12 sm:py-14">
      <header className="avoid-break border-b border-rule pb-8">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone">
            <BrandMark className="size-6" />
            {settings.assessment.brand}
          </span>
          {sample ? (
            <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold tracking-wide text-stone uppercase">
              Sample report
            </span>
          ) : null}
        </div>
        <h1 className="mt-8 font-serif text-[2.1rem] leading-[1.12] font-semibold tracking-tight sm:text-5xl">
          {report.title}
        </h1>
        <p className="mt-4 text-stone">
          Prepared for <span className="font-semibold text-ink">{report.firstName}</span> ·{" "}
          <time dateTime={report.dateISO}>{longDate(report.dateISO)}</time>
        </p>
      </header>

      <section aria-labelledby="key-statement" className="avoid-break py-10">
        <h2 id="key-statement" className="eyebrow">
          Your key statement
        </h2>
        <blockquote className="mt-4 border-l-4 border-clay pl-5 font-serif text-[1.55rem] leading-snug font-medium sm:pl-7 sm:text-[1.9rem]">
          {report.keyStatement}
        </blockquote>
      </section>

      <section aria-labelledby="profile" className="avoid-break rounded-xl bg-sand px-5 py-7 sm:px-8">
        <h2 id="profile" className="eyebrow">
          Your profile
        </h2>
        <div className="mt-3 grid items-center gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
          <ProfileFigure traits={report.profile.traits} className="mx-auto w-full max-w-[17rem]" />
          <div>
            <p className="font-serif text-3xl leading-tight font-semibold">{report.profile.name}</p>
            <p className="mt-2 text-[0.95rem] text-ink">{report.profile.summary}</p>
          </div>
        </div>
        <dl className="mt-6 divide-y divide-[#d9cfbe] border-t border-[#d9cfbe]">
          {report.profile.traits.map((t) => (
            <div key={t.partId} className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[13.5rem_1fr] sm:items-baseline">
              <dt className="flex items-center justify-between gap-3 font-semibold sm:block">
                <span className="block">{t.name}</span>
                <span className="sm:mt-1 sm:block">
                  <Dots score={t.score} />
                </span>
              </dt>
              <dd className="text-[0.95rem] text-ink">{t.line}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="py-4">
        {report.sections.map((s) => (
          <section key={s.heading} className="avoid-break border-b border-rule py-8 last:border-b-0">
            <h2 className="font-serif text-2xl font-semibold">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="prose-measure mt-3 text-[1.02rem] leading-relaxed">
                {p}
              </p>
            ))}
            {s.quote ? (
              <figure className="mt-5">
                <figcaption className="eyebrow">In your words</figcaption>
                <blockquote className="prose-measure mt-1.5 font-serif text-lg leading-relaxed text-stone italic">
                  “{s.quote}”
                </blockquote>
              </figure>
            ) : null}
          </section>
        ))}
      </div>

      <section aria-labelledby="next-steps" className="avoid-break border-t-2 border-ink pt-8">
        <h2 id="next-steps" className="font-serif text-2xl font-semibold">
          What to do next
        </h2>
        <ol className="mt-5 space-y-5">
          {report.nextSteps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
              <span aria-hidden className="font-serif text-3xl leading-none font-semibold text-clay">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="prose-measure mt-1 text-[0.98rem]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="resources" className="avoid-break mt-10">
        <h2 id="resources" className="font-serif text-2xl font-semibold">
          Resources
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {report.resources.map((r) => (
            <li key={r.title} className="rounded-lg border border-rule p-4">
              <FileText aria-hidden className="size-5 text-pine" />
              <p className="mt-2 leading-snug font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-stone">{r.kind} · PDF</p>
            </li>
          ))}
        </ul>
        <p className="no-print mt-3 text-sm text-stone">
          Placeholder titles. In the real product these are the owner&apos;s own resource PDFs, attached to the report
          email.
        </p>
      </section>

      <p className="mt-10 border-t border-rule pt-6 text-sm text-stone">{report.note}</p>
    </article>
  );
}

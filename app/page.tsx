import { ArrowRight, Clock, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { Purchase } from "@/components/purchase";
import { ProfileFigure } from "@/components/report/profile-figure";
import { SiteHeader } from "@/components/site-header";
import { buttonStyles } from "@/components/ui/button";
import { sampleReport } from "@/lib/report/sample";
import { formatPrice, salesPage, settings } from "@/lib/settings";

const factIcons = [Clock, Lock, Smartphone];

export default function HomePage() {
  const report = sampleReport();
  const { prices } = settings;
  return (
    <>
      <SiteHeader variant="sales" />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow">{salesPage.eyebrow}</p>
            <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.06] font-semibold tracking-tight sm:text-6xl">
              {salesPage.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed">{salesPage.lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a href="#buy" className={buttonStyles({ size: "lg" })}>
                Buy the assessment · {formatPrice(prices.single)}
              </a>
              <Link href="/code" className="link inline-flex min-h-11 items-center">
                I already have a code
              </Link>
            </div>
            <ul className="mt-9 grid gap-3 text-[0.95rem] sm:grid-cols-3">
              {salesPage.facts.map((fact, i) => {
                const Icon = factIcons[i] ?? Clock;
                return (
                  <li key={fact} className="flex items-start gap-2.5">
                    <Icon aria-hidden className="mt-1 size-4 shrink-0 text-pine" />
                    <span>{fact}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-xl border border-rule bg-white p-7 shadow-[0_24px_60px_-28px_rgba(31,42,55,0.35)] sm:p-9">
              <p className="eyebrow">From the sample report</p>
              <p className="mt-2 font-serif text-2xl font-semibold">{report.title}</p>
              <p className="text-sm text-stone">Prepared for {report.firstName}, an invented person</p>
              <blockquote className="mt-6 border-l-4 border-clay pl-5 font-serif text-[1.3rem] leading-snug font-medium">
                {report.keyStatement}
              </blockquote>
              <div className="mt-6 grid items-center gap-4 rounded-lg bg-sand p-4 sm:grid-cols-[11rem_1fr]">
                <ProfileFigure traits={report.profile.traits} className="mx-auto w-44" />
                <div>
                  <p className="eyebrow">Profile</p>
                  <p className="font-serif text-xl font-semibold">{report.profile.name}</p>
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {report.profile.traits.slice(0, 3).map((t) => (
                      <li key={t.partId}>{t.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Link href="/sample-report" className="link mt-6 inline-flex min-h-11 items-center gap-1.5">
                Read the full sample report
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-rule bg-sand/60">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">How it goes</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {salesPage.steps.map((step, i) => (
                <li key={step.title}>
                  <span aria-hidden className="font-serif text-4xl font-semibold text-clay">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-[0.98rem]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="buy" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 sm:px-8">
          <h2 className="font-serif text-3xl font-semibold tracking-tight">{salesPage.pricingHeading}</h2>
          <p className="mt-2 max-w-2xl text-stone">
            Each access code opens one assessment and one report. A code brings you back to where you stopped, on any
            device.
          </p>
          <div className="mt-8">
            <Purchase
              offers={[
                {
                  id: "single",
                  name: salesPage.single.name,
                  blurb: salesPage.single.blurb,
                  price: formatPrice(prices.single),
                  each: "for one code",
                },
                {
                  id: "twoPack",
                  name: salesPage.twoPack.name,
                  blurb: salesPage.twoPack.blurb,
                  price: formatPrice(prices.twoPack),
                  each: "for two codes",
                },
              ]}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-6 sm:px-8 md:grid-cols-2">
          <div className="rounded-xl border border-rule bg-white p-7">
            <h2 className="font-serif text-2xl font-semibold">{salesPage.privacyHeading}</h2>
            <p className="mt-3">{salesPage.privacyBody}</p>
          </div>
          <div className="rounded-xl border border-dashed border-line p-7">
            <h2 className="font-serif text-2xl font-semibold">What is real in this sample, and what is not</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>The assessment, the names and the report text are invented.</li>
              <li>The guide is simulated with scripted reflections and rules. No AI model is called.</li>
              <li>No payment is taken, and no email is sent. Codes and reports land in the Demo inbox.</li>
              <li>
                Saving, resuming with a code, the report job, deletion and the owner admin are real, running code.{" "}
                <Link href="/how-it-works" className="link">
                  How it works
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}

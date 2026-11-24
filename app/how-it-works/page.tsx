import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProfileFigure } from "@/components/report/profile-figure";
import { SiteHeader } from "@/components/site-header";
import { sampleReport } from "@/lib/report/sample";
import { RETENTION_DAYS } from "@/lib/sandbox-ref";
import { settings } from "@/lib/settings";

export const metadata: Metadata = { title: "How it works" };

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-6 border-t border-rule py-12">
      <h2 id={id} className="font-serif text-3xl leading-tight font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[1.02rem]">{children}</div>
    </section>
  );
}

function Source({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="link" rel="noreferrer">
      {children}
    </a>
  );
}

const simulated: { piece: string; here: string; real: string }[] = [
  {
    piece: "The guide",
    here: "Scripted reflections and rules: a short answer gets one follow-up, and the reflection is chosen from words in the answer. No model is called.",
    real: "Your finished prompt, sent with the conversation to the Claude API from the server. The API key never reaches the browser.",
  },
  {
    piece: "Payment",
    here: "A button. No card is asked for.",
    real: "The payment provider's hosted checkout. Codes are issued when the provider confirms the payment, and issuing is safe to repeat, so a confirmation that arrives twice never creates extra codes.",
  },
  {
    piece: "Email",
    here: "The Demo inbox at the top of every page.",
    real: "A transactional email service for codes and reports, and the buyer added to your Kit list.",
  },
  {
    piece: "Storage",
    here: "A private file store in the same hosting account, read and written only by the server. Answers are encrypted before they are stored.",
    real: "A Postgres database with the same split: plain status fields, encrypted answers.",
  },
  {
    piece: "The report job",
    here: "A job whose stage is worked out from its start time, stored on the server. About 25 seconds.",
    real: "A background job that calls the model and writes each stage to the database. One to two minutes.",
  },
  {
    piece: "The PDF",
    here: "The report page with a print layout: Download PDF opens the print dialog.",
    real: "The same template rendered to a PDF file on the server, so the download and the email attachment are one file.",
  },
  {
    piece: "Token counts and cost",
    here: "Estimated from text length, about four characters to a token.",
    real: "The input and output token counts the API returns with every response, added up per session.",
  },
  {
    piece: "Owner sign-in",
    here: "One click, no password, into your own private copy of the sample.",
    real: "The owner's own sign-in.",
  },
];

const owned = [
  ["Your domain", "Stays at GoDaddy. Two DNS records point it at the app host."],
  ["The app host", "Runs the site and holds the secret keys as environment settings."],
  ["The database", "Codes, sessions, encrypted answers and reports."],
  ["The payment account", "Takes the money, pays out to you, and is where refunds are issued."],
  ["The email sender", "Sends access codes and reports from your domain."],
  ["Your Kit account", "Buyers are added to the list you choose."],
  ["The AI account", "The Claude API key and its monthly spend limit."],
  ["The code repository", "All the code, the settings folder and the handover guide."],
];

export default function HowItWorksPage() {
  const report = sampleReport();
  return (
    <>
      <SiteHeader variant="owner" current="/how-it-works" />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 pt-10 pb-6 sm:px-8">
        <p className="eyebrow">How it works</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          What this sample does, and what the real build would do
        </h1>
        <p className="mt-5 max-w-3xl text-lg">
          This is a working sample of the journey around a guided self-assessment: a code, a conversation one question
          at a time, a report, and an owner&apos;s view. The assessment, the names and the report text are invented.
          The guide is simulated, no payment is taken, and nothing is emailed. The parts that are hard to get right
          are real, running code: saving after every answer, resuming with the code alone, a report that outlives the
          page, deletion, and an admin area that does not read answers.
        </p>
        <nav aria-label="On this page" className="mt-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem]">
            {[
              ["#simulated", "What is simulated"],
              ["#state", "Saving and resuming"],
              ["#job", "The report job"],
              ["#template", "Two ways to lay out the report"],
              ["#privacy", "Privacy"],
              ["#own", "What you would own"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="link inline-flex min-h-10 items-center">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8">
          <Section id="simulated" title="What is simulated, and what production would use">
            <div className="overflow-x-auto rounded-xl border border-rule bg-white" tabIndex={0} role="region" aria-label="Sample compared with production">
              <table className="w-full min-w-[40rem] border-collapse text-left text-[0.93rem]">
                <thead>
                  <tr className="border-b border-rule text-xs tracking-wide text-stone uppercase">
                    <th scope="col" className="w-[9.5rem] px-4 py-3 font-semibold">Piece</th>
                    <th scope="col" className="px-4 py-3 font-semibold">In this sample</th>
                    <th scope="col" className="px-4 py-3 font-semibold">In the real build</th>
                  </tr>
                </thead>
                <tbody>
                  {simulated.map((row) => (
                    <tr key={row.piece} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="px-4 py-3 align-top font-semibold">{row.piece}</th>
                      <td className="px-4 py-3 align-top">{row.here}</td>
                      <td className="px-4 py-3 align-top">{row.real}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="state" title="How the conversation is stored between messages">
            <p className="max-w-3xl">
              The model&apos;s API keeps no memory between requests. Each request has to carry the prompt and the whole
              conversation so far (
              <Source href="https://platform.claude.com/docs/en/build-with-claude/working-with-messages">
                Anthropic: working with messages
              </Source>
              ). So the app keeps the conversation itself, on the server, and the browser holds nothing that matters.
            </p>
            <ol className="max-w-3xl list-decimal space-y-2 pl-5">
              <li>You press Continue. The answer goes to the server.</li>
              <li>
                The server adds it to the stored conversation, gets the reflection and the next question, stores those
                too, and only then replies. &ldquo;Saved 10:42&rdquo; on screen means written on the server.
              </li>
              <li>
                Coming back, on any device, the code finds the session and the app shows the first question without an
                answer. There is no account and no password.
              </li>
              <li>
                The answer you are still typing is kept on the device as you type, so a reload or a dead battery does
                not lose it. It is sent only when you continue.
              </li>
            </ol>
            <p className="max-w-3xl">
              If the same answer arrives twice, after a retry on a weak signal or a double tap, the second copy is
              recognised and ignored. If two devices answer at the same moment, one of them is asked to retry on the
              newer conversation, so nothing is overwritten.
            </p>
            <p className="max-w-3xl rounded-lg bg-sand p-4 text-[0.95rem]">
              <strong>Checked on this live site:</strong> an automated test starts a session in one browser, answers
              two questions, then enters the same code in a second, separate browser with no shared cookies or storage,
              and confirms it opens on the third question with both answers kept.
            </p>
          </Section>

          <Section id="job" title="Why the report runs as a background job">
            <p className="max-w-3xl">
              The report takes one to two minutes to write. Whether a web request may run that long depends on the
              host: Heroku cuts a request off at 30 seconds (
              <Source href="https://devcenter.heroku.com/articles/request-timeout">source</Source>), Netlify allows 60
              seconds for an ordinary function and 15 minutes for a background one (
              <Source href="https://docs.netlify.com/build/functions/configuration/">source</Source>), Vercel allows
              300 seconds by default (<Source href="https://vercel.com/docs/functions/limitations">source</Source>),
              and Render allows far longer (<Source href="https://render.com/docs/render-vs-vercel-comparison">source</Source>).
              So on some hosts a two-minute request would fit.
            </p>
            <p className="max-w-3xl">
              The stronger reason is the phone. In two minutes a screen locks, a signal drops, or a tab is closed. If
              the report were tied to the open page, any of those would lose it after an hour of someone&apos;s
              answers. So the last answer is saved, a job starts on the server, and the page only asks, every two
              seconds, which stage the job has reached.
            </p>
            <ul className="max-w-3xl list-disc space-y-1.5 pl-5">
              <li>Refresh during the wait, and the same stage comes back.</li>
              <li>Close the page, and the job finishes anyway. The code opens the finished report.</li>
              <li>The stages are named, with a time estimate, so the page never looks frozen.</li>
              <li>In the real build the report is also emailed, which covers a phone that stays off.</li>
            </ul>
          </Section>

          <Section id="template" title="Two ways to lay out the report">
            <p className="max-w-3xl">
              The report can be shown by (a) styling whatever formatted text the model writes, or (b) having the model
              return labeled sections that fill a designed template. This sample is built the second way. Here is the
              same sample report both ways.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-rule bg-white p-5">
                <p className="eyebrow">(a) Formatted text, styled</p>
                <div className="mt-3 space-y-2 border-t border-rule pt-3 text-[0.92rem]">
                  <p className="font-serif text-xl font-semibold">{report.title}</p>
                  <p>
                    <strong>Key statement:</strong> {report.keyStatement}
                  </p>
                  <p className="pt-1 font-serif text-lg font-semibold">Profile: {report.profile.name}</p>
                  <ul className="list-disc pl-5">
                    {report.profile.traits.map((t) => (
                      <li key={t.partId}>
                        {t.name} ({t.score}/5)
                      </li>
                    ))}
                  </ul>
                  <p className="pt-1 font-serif text-lg font-semibold">{report.sections[0]?.heading}</p>
                  <p>{report.sections[0]?.paragraphs[0]}</p>
                </div>
                <p className="mt-4 text-sm text-stone">
                  One look for headings, paragraphs and lists. The page cannot tell the key statement from any other
                  paragraph, so it cannot give it its own treatment.
                </p>
              </div>
              <div className="rounded-xl border border-pine bg-white p-5">
                <p className="eyebrow">(b) Labeled sections in a template</p>
                <div className="mt-3 border-t border-rule pt-3">
                  <p className="font-serif text-xl font-semibold">{report.title}</p>
                  <blockquote className="mt-3 border-l-4 border-clay pl-4 font-serif text-[1.08rem] leading-snug font-medium">
                    {report.keyStatement}
                  </blockquote>
                  <div className="mt-4 grid grid-cols-[7.5rem_1fr] items-center gap-3 rounded-lg bg-sand p-3">
                    <ProfileFigure traits={report.profile.traits} className="w-full" />
                    <div>
                      <p className="eyebrow">Profile</p>
                      <p className="font-serif text-lg leading-tight font-semibold">{report.profile.name}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-stone">
                  The model returns <span className="font-mono text-[0.8rem]">key_statement</span>,{" "}
                  <span className="font-mono text-[0.8rem]">profile</span>,{" "}
                  <span className="font-mono text-[0.8rem]">sections</span> and so on. Each has its own place and
                  style, and the figure is drawn from the scores.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-rule bg-white" tabIndex={0} role="region" aria-label="Comparison of the two approaches">
              <table className="w-full min-w-[38rem] border-collapse text-left text-[0.93rem]">
                <thead>
                  <tr className="border-b border-rule text-xs tracking-wide text-stone uppercase">
                    <th scope="col" className="w-[11rem] px-4 py-3 font-semibold">Question</th>
                    <th scope="col" className="px-4 py-3 font-semibold">(a) Styled text</th>
                    <th scope="col" className="px-4 py-3 font-semibold">(b) Template</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Title, key statement and profile visibly styled", "Only as far as headings and bold allow.", "Yes. Each is a named field with its own design."],
                    ["Same layout every time", "Depends on the model keeping to a format.", "Yes. The layout is fixed; only the words change."],
                    ["Screen, PDF and email match", "Yes, if all three use the one style.", "Yes. All three fill the one template."],
                    ["Change to your prompt", "None.", "A closing instruction listing the fields to return."],
                    ["When the model misses a field", "Nothing to check, so nothing is caught.", "Checked before the customer sees it; one automatic retry."],
                    ["Build effort", "Smaller.", "Larger: the template, the check and the retry."],
                  ].map(([q, a, b]) => (
                    <tr key={q} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="px-4 py-3 align-top font-semibold">{q}</th>
                      <td className="px-4 py-3 align-top">{a}</td>
                      <td className="px-4 py-3 align-top">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="max-w-3xl">
              The prose inside each section is still the model&apos;s own writing in both cases. The difference is
              whether the page knows which piece is which. See the template filled in on the{" "}
              <Link href="/sample-report" className="link">
                sample report
              </Link>
              .
            </p>
          </Section>

          <Section id="privacy" title="Privacy, shown in running code">
            <ul className="max-w-3xl list-disc space-y-2 pl-5">
              <li>
                <strong>Two halves.</strong> Each session has a plain half (status, dates, token counts) and a sealed
                half (first name, answers, report). The sealed half is encrypted with AES-256-GCM using a key that
                exists only in the server&apos;s environment.
              </li>
              <li>
                <strong>The admin list reads the plain half only.</strong> The{" "}
                <Link href="/admin" className="link">
                  owner admin
                </Link>{" "}
                shows status, last activity and cost without decrypting anything.
              </li>
              <li>
                <strong>Opening a transcript is deliberate and logged.</strong> It needs a reason, and the reason, the
                time and the session are written to the access log in the same step that returns the answers.
              </li>
              <li>
                <strong>Codes are not stored.</strong> Only a keyed one-way hash is kept, plus the first four
                characters for recognition. A code created by hand is shown once.
              </li>
              <li>
                <strong>Delete means delete.</strong> &ldquo;Delete my answers&rdquo; on the report removes the sealed
                half from the stored record. What remains says only that the code was used.
              </li>
              <li>
                <strong>Nothing sensitive in the browser.</strong> The session is held by an http-only cookie the page
                cannot read. The only thing kept on the device is the answer still being typed.
              </li>
              <li>
                <strong>A fixed lifetime.</strong> In this sample each visitor&apos;s data is private to them and is
                removed by a daily job {RETENTION_DAYS} days after it was created. The real product would follow the
                retention period you choose.
              </li>
            </ul>
            <p className="max-w-3xl text-[0.95rem] text-stone">
              For the real build: Anthropic states that API inputs and outputs are not used to train its models by
              default (<Source href="https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training">source</Source>
              ) and describes its retention period (
              <Source href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data">source</Source>
              ). Those are worth stating in your own privacy notice.
            </p>
          </Section>

          <Section id="own" title="What you would own">
            <p className="max-w-3xl">
              Every service runs in an account opened in the owner&apos;s name. The developer is added as a
              collaborator for the build and removed at handover.
            </p>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {owned.map(([name, what]) => (
                <div key={name} className="border-l-2 border-clay pl-4">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="text-[0.95rem]">{what}</dd>
                </div>
              ))}
            </dl>
            <p className="max-w-3xl">
              The model and the prompt are read from the{" "}
              <Link href="/settings" className="link">
                settings file
              </Link>
              ; this sample is set to <span className="font-mono text-[0.9rem]">{settings.model.name}</span>.
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ReportJobDiagram } from "@/components/diagrams/report-job";
import { ProfileFigure } from "@/components/report/profile-figure";
import { SiteHeader } from "@/components/site-header";
import { TryIt } from "@/components/try-it";
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
    here: "Scripted reflections and rules: a short answer gets one follow-up, and the reflection is chosen from words in the answer. No model is called, so a line may not match an answer you type yourself.",
    real: "Your finished prompt, sent with the conversation to the Claude API from the server. The API key never reaches the browser.",
  },
  {
    piece: "The report text",
    here: "Assembled by rules from words in the answers: each part reads as one of two patterns, or as neither when the words point both ways or nowhere.",
    real: "Written by the model from your prompt, and returned as labeled sections that fill the same template.",
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
    here: "A timer. The report is already assembled when the last answer is saved; the stage shown is worked out from a start time stored on the server. About 25 seconds.",
    real: "A background job that calls the model and writes each stage to the database. One to two minutes.",
  },
  {
    piece: "The PDF",
    here: "The report page with a print layout: Save as PDF opens the print dialog.",
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
  ["The app host: Vercel", "Runs the site and the report job, and holds the secret keys as environment settings."],
  ["The database: Postgres at Neon", "Codes, sessions, encrypted answers and reports."],
  ["The payment account: Stripe", "Takes the money and pays out to you. Refunds are issued from your admin and paid back through this account."],
  ["The email sender: Resend", "Sends access codes and reports from your domain."],
  ["Your Kit account", "Buyers are added to the list you choose."],
  ["The AI account", "The Claude API key and its monthly spend limit."],
  ["The code repository: GitHub", "All the code, the settings folder and the handover guide."],
];

/** The admin items the brief lists that this sample leaves out, and what the real build does for each. */
const adminLater = [
  ["Reports", "The owner opens a customer's report through the same step as a transcript: a reason first, and a line in the access log."],
  ["Feedback", "Customer and beta feedback, listed against the session it came from."],
  ["Refunds", "A Refund button on the session. It calls the payment provider, records the refund and retires the code."],
  ["Prices", "Edited in the admin and used by checkout from the next sale on."],
  ["Beta mode", "Invited testers get codes marked as beta, a debrief form after the report, and CSV exports of sessions, feedback and debriefs."],
];

/**
 * The shape of the real request, shown as text. Nothing in this sample runs
 * it. Lines are kept short so the block reads on a phone without scrolling.
 */
const requestShape = `const reply = await client.messages.create({
  // the model named in the settings file
  model: settings.model.name,
  max_tokens: 16000,
  // repeated text is read at the cached rate
  cache_control: { type: "ephemeral" },
  // your prompt, kept on the server
  system: guidePrompt,
  // every stored turn, in order
  messages: toMessages(session.turns),
});
// what this reply cost, for the admin
await addUsage(session.id, reply.usage);`;

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
          are real, running code: saving after every answer, resuming with the code alone, a waiting screen whose
          stage is read from the server, so it survives a refresh, a closed page and another device (the job itself is
          a timer in this sample), deletion, and an admin area that does not read answers.
        </p>
        <div className="mt-8">
          <TryIt />
        </div>
        <nav aria-label="On this page" className="mt-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem]">
            {[
              ["#simulated", "What is simulated"],
              ["#state", "Saving and resuming"],
              ["#job", "The report job"],
              ["#template", "Two ways to lay out the report"],
              ["#privacy", "Privacy"],
              ["#admin", "The owner admin"],
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
              <table className="stack-table w-full border-collapse text-left text-[0.93rem] sm:min-w-[34rem]">
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
                      <td data-label="In this sample" className="px-4 py-3 align-top">{row.here}</td>
                      <td data-label="In the real build" className="px-4 py-3 align-top">{row.real}</td>
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
              recognized and ignored. If two devices answer at the same moment, one of them is asked to retry on the
              newer conversation, so nothing is overwritten.
            </p>
            <p className="max-w-3xl rounded-lg bg-sand p-4 text-[0.95rem]">
              <strong>Checked on this live site:</strong> an automated test starts a session in one browser, answers
              two questions, then enters the same code in a second, separate browser with no shared cookies or storage,
              and confirms it opens on the third question with both answers kept. It does the same with the ready-made
              &ldquo;Partway through&rdquo; code from the Demo inbox.
            </p>
            <p className="max-w-3xl">
              In the real build, each turn rebuilds the request from what is stored. This is its shape; nothing in this
              sample runs it.
            </p>
            <pre
              tabIndex={0}
              aria-label="The shape of the request to the model"
              className="max-w-3xl overflow-x-auto rounded-xl border border-rule bg-white p-4 font-mono text-[0.72rem] leading-relaxed sm:text-[0.82rem]"
            >
              {requestShape}
            </pre>
            <p className="max-w-3xl text-[0.95rem] text-stone">
              The usage numbers that come back with every reply (<span className="font-mono text-[0.85rem]">input_tokens</span>,{" "}
              <span className="font-mono text-[0.85rem]">output_tokens</span> and, with caching,{" "}
              <span className="font-mono text-[0.85rem] [overflow-wrap:anywhere]">cache_read_input_tokens</span>) are
              added up per session. That sum is the cost column in the owner admin.
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
            {/* The same idea as a picture, beside the list on a wide screen and above it on a phone. */}
            <div className="grid max-w-3xl items-center gap-x-10 gap-y-5 md:grid-cols-[minmax(0,24rem)_1fr]">
              <figure className="border-y border-rule py-5">
                <ReportJobDiagram className="block h-auto w-full" />
                <figcaption className="mt-4 text-sm text-stone">
                  The job lives on the server. The page only asks how far it has got, so a phone that drops out loses
                  nothing.
                </figcaption>
              </figure>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Refresh during the wait, and the same stage comes back.</li>
                <li>Close the page, and nothing is lost: the report never depended on it. The code opens the report.</li>
                <li>The stages are named, with a time estimate, so the page never looks frozen.</li>
                <li>In the real build the report is also emailed, which covers a phone that stays off.</li>
              </ul>
            </div>
            <p className="max-w-3xl rounded-lg bg-sand p-4 text-[0.95rem]">
              <strong>What this sample does not exercise.</strong> Here the job is a timer: the page-and-server half
              above is real, and no work runs in the background. In the real build on Vercel, the request that saves
              the last answer also writes a job row to the database and starts a background task (Next.js{" "}
              <span className="font-mono text-[0.85rem]">after</span>), which the host keeps running once the response
              has been sent, for up to 300 seconds by default (
              <Source href="https://vercel.com/docs/functions/limitations">source</Source>). That task calls the model,
              writes each stage to the job row as it goes, and stores the finished report; the waiting screen reads
              that row exactly as it reads the timer here. If the call fails or the task is cut off, the row still says
              where it stopped. A scheduled check once a minute restarts any job that has run too long, from the same
              stored conversation and under the same job, so a retry can never produce two reports. After three
              attempts the session is flagged in your admin, and the customer is told the report will arrive by email.
            </p>
          </Section>

          <Section id="template" title="Two ways to lay out the report">
            <p className="max-w-3xl">
              The report can be shown by (a) styling whatever formatted text the model writes, or (b) having the model
              return labeled sections that fill a designed template. This sample is built the second way. Here is the
              same sample report both ways.
            </p>
            <p className="max-w-3xl border-l-4 border-pine pl-4">
              <strong>My recommendation is (b).</strong> Your done-list asks for the title, key statement and profile
              to be visibly styled, and only a template can promise that every time, on screen, in the PDF and in the
              email.
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
                  <div className="mt-4 rounded-lg bg-sand p-3">
                    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
                      <ProfileFigure traits={report.profile.traits} labels={false} className="w-full" />
                      <div>
                        <p className="eyebrow">Profile</p>
                        <p className="font-serif text-lg leading-tight font-semibold">{report.profile.name}</p>
                      </div>
                    </div>
                    <dl className="mt-3 divide-y divide-[#d9cfbe] border-t border-[#d9cfbe] text-[0.88rem]">
                      {report.profile.traits.slice(0, 2).map((t) => (
                        <div key={t.partId} className="flex items-center justify-between gap-3 py-1.5">
                          <dt className="font-semibold">{t.name}</dt>
                          <dd>
                            <span className="inline-flex items-center gap-1" role="img" aria-label={`${t.score} of 5`}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span
                                  key={n}
                                  className={n <= t.score ? "size-2 rounded-full bg-pine" : "size-2 rounded-full border border-line bg-paper"}
                                />
                              ))}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <p className="mt-4 font-serif text-lg font-semibold">{report.sections[0]?.heading}</p>
                  <p className="eyebrow mt-2">In your words</p>
                  <p className="mt-1 font-serif text-[0.95rem] leading-snug text-stone italic">
                    &ldquo;{report.sections[0]?.quote}&rdquo;
                  </p>
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
              <table className="stack-table w-full border-collapse text-left text-[0.93rem] sm:min-w-[34rem]">
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
                      <td data-label="(a) Styled text" className="px-4 py-3 align-top">{a}</td>
                      <td data-label="(b) Template" className="px-4 py-3 align-top">{b}</td>
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
                <strong>Opening a transcript is deliberate and logged.</strong> The server refuses a request without a
                reason, and the reason, the time and the session are written to the access log in the same step that
                returns the answers.
              </li>
              <li>
                <strong>The session record holds no code.</strong> It keeps a keyed one-way hash of the code, plus the
                first four characters for recognition. The code itself lives in the email that was sent, and a code
                created by hand is shown once. If a code is lost, the owner, or a &ldquo;Lost your code?&rdquo; form,
                issues a new one to the purchase email and the old one stops working. In this sample the Demo inbox
                stands in for the buyer&apos;s mailbox, so it holds the simulated emails, codes included, encrypted.
              </li>
              <li>
                <strong>Delete means delete.</strong> &ldquo;Delete my answers&rdquo; on the report removes the sealed
                half from the stored record. What remains says only that the code was used.
              </li>
              <li>
                <strong>Only the unsent answer stays on the device.</strong> The session is held by an http-only
                cookie the page cannot read, and its value is sealed with the server&apos;s key, so it cannot be read,
                altered or made by hand. The answer still being typed is kept on the device until it is sent; Take a
                break offers to remove it on a shared computer.
              </li>
              <li>
                <strong>Back does not bring it back.</strong> Deleting, or leaving with Take a break, replaces the page
                in the browser&apos;s history, and a page restored by the Back button checks with the server before it
                shows anything.
              </li>
              <li>
                <strong>A fixed lifetime.</strong> In this sample each visitor has a space of their own, a code opens
                only its one session from another device, and everything is removed by a daily job {RETENTION_DAYS}{" "}
                days after it was created. The real product would follow the retention period you choose.
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

          <Section id="admin" title="The owner admin: what is here, and what the real build adds">
            <p className="max-w-3xl">
              The{" "}
              <Link href="/admin" className="link">
                owner admin
              </Link>{" "}
              in this sample covers five of the things your brief lists: access codes, sessions, AI cost per session,
              creating a code by hand and reopening an expired session. The other five are not built here. In the real
              build:
            </p>
            <dl className="grid max-w-3xl gap-y-3">
              {adminLater.map(([name, what]) => (
                <div key={name} className="grid gap-x-4 sm:grid-cols-[7rem_1fr]">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="text-[0.98rem]">{what}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="own" title="What you would own">
            <p className="max-w-3xl">
              Every service runs in an account opened in the owner&apos;s name. The developer is added as a
              collaborator for the build and removed at handover.
            </p>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {owned.map(([name, what]) => (
                <div key={name} className="border-l-2 border-rule pl-4">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="text-[0.95rem]">{what}</dd>
                </div>
              ))}
            </dl>
            <p className="max-w-3xl rounded-lg bg-sand p-4 text-[0.95rem]">
              <strong>Running cost, estimated: about $20 to $40 a month</strong> before any sale. Vercel Pro is $20 (
              <Source href="https://vercel.com/pricing">source</Source>). Neon&apos;s Postgres has a free plan to
              start, then pay-as-you-go (<Source href="https://neon.com/pricing">source</Source>). Resend is free up
              to 3,000 emails a month, then $20 (<Source href="https://resend.com/pricing">source</Source>). On top
              come Stripe&apos;s fee of 2.9% plus 30 cents on each US card sale (
              <Source href="https://stripe.com/pricing">source</Source>) and the AI cost of each session, which the
              admin shows. List prices as read on November 24, 2026.
            </p>
            <p className="max-w-3xl">
              The model, the prompt and the sales text are read from the{" "}
              <Link href="/settings" className="link">
                settings files
              </Link>
              ; this sample is set to <span className="font-mono text-[0.9rem]">{settings.model.name}</span>.
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}

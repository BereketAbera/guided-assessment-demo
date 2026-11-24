import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Fragment } from "react";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, salesPage, settings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings files" };

function read(name: string): string {
  return readFileSync(path.join(process.cwd(), "settings", name), "utf8");
}

/** A file name as a heading: it may break anywhere, so a long name never pushes a phone screen sideways. */
function FileHeading({ id, name }: { id: string; name: string }) {
  return (
    <h2 id={id} className="font-mono text-base font-semibold [overflow-wrap:anywhere] sm:text-xl">
      {name}
    </h2>
  );
}

function Row({ label, value, where }: { label: string; value: React.ReactNode; where: string }) {
  return (
    <tr className="border-b border-rule last:border-b-0">
      <th scope="row" className="py-3 pr-4 text-left align-top font-semibold">
        {label}
      </th>
      <td data-label="Value now" className="py-3 pr-4 align-top">
        {value}
      </td>
      {/* On a wide screen a key breaks only between keys, never inside one; on a phone it may break anywhere. */}
      <td data-label="Key in the file" className="py-3 align-top font-mono text-[0.8rem] text-stone max-sm:[overflow-wrap:anywhere]">
        {where.split(", ").map((key, i) => (
          <Fragment key={key}>
            {i > 0 ? ", " : null}
            <span className="sm:whitespace-nowrap">{key}</span>
          </Fragment>
        ))}
      </td>
    </tr>
  );
}

/** Read-only view of the files the owner would edit. Rendered when the site is built, from the files themselves. */
export default function SettingsPage() {
  const json = read("assessment.settings.json");
  const sales = read("sales-page.json");
  const prompt = read(settings.promptFile);
  const { model, prices, assessment, parts, reportJob } = settings;

  return (
    <>
      <SiteHeader variant="owner" current="/settings" />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <p className="eyebrow">Settings files</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight font-semibold tracking-tight">
          The prompt, the model and the sales text, kept out of the code
        </h1>
        <p className="mt-4 max-w-3xl text-lg">
          Everything the owner is likely to change lives in three plain files in a{" "}
          <span className="font-mono text-base">settings</span> folder: the settings (model, prices, time limit), the
          prompt, and the text of the sales page. The app reads them; nothing else needs touching. This page shows them
          as they are right now, read-only.
        </p>

        <section aria-labelledby="change" className="mt-8 rounded-xl bg-sand p-5 sm:p-6">
          <h2 id="change" className="font-serif text-xl font-semibold">
            How you would change one
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.98rem]">
            <li>Open the file in your code repository in the browser and click the pencil.</li>
            <li>Change the value: a model name, a price, a headline, or paste a new prompt.</li>
            <li>Press Commit. The host rebuilds the site and the change is live in about a minute.</li>
          </ol>
          <p className="mt-3 text-sm text-stone">
            The prompt is its own text file so it can be pasted in as written, with no quoting or escaping. If the
            settings file is saved with a mistake in its format, the build fails and the live site stays on the last
            good version. In the real build, prices are also editable from the admin area, as the brief asks; the file
            stays the place for the prompt and the model.
          </p>
        </section>

        <section aria-labelledby="values" className="mt-10">
          <h2 id="values" className="font-serif text-2xl font-semibold">
            What the app is reading right now
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-white sm:px-5" tabIndex={0} role="region" aria-label="Current settings">
            <table className="stack-table w-full border-collapse text-[0.95rem] sm:min-w-[32rem]">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Setting</th>
                  <th scope="col">Value</th>
                  <th scope="col">Key in the file</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Model" value={<span className="font-mono" data-testid="settings-model">{model.name}</span>} where="model.name" />
                <Row
                  label="Model prices"
                  value={`$${model.inputPricePerMillionTokens} per million tokens in, $${model.outputPricePerMillionTokens} out`}
                  where="model.*PricePerMillionTokens"
                />
                <Row
                  label="Selling prices"
                  value={`${formatPrice(prices.single)} single, ${formatPrice(prices.twoPack)} two-pack`}
                  where="prices.single, prices.twoPack"
                />
                <Row
                  label="Time limit"
                  value={`${assessment.timeLimitDays} days from the moment the assessment is started; a reopened session gets ${assessment.reopenDays} more`}
                  where="assessment.timeLimitDays, reopenDays"
                />
                <Row
                  label="Time zone"
                  value={`${assessment.timeZone}: the date on a report and the times in the admin area`}
                  where="assessment.timeZone"
                />
                <Row
                  label="Parts"
                  value={parts.map((p) => `${p.title} (${p.minutes} min)`).join(", ")}
                  where="parts[]"
                />
                <Row
                  label="Report stages"
                  value={reportJob.stages.map((s) => s.label).join(", ")}
                  where="reportJob.stages[]"
                />
                <Row label="Prompt" value={`${prompt.split(/\s+/).filter(Boolean).length} words, shown below`} where={`promptFile → ${settings.promptFile}`} />
                <Row
                  label="Sales page text"
                  value={
                    <>
                      Headline &ldquo;{salesPage.headline}&rdquo;, the three steps, the pricing labels and the privacy
                      paragraph, shown below
                    </>
                  }
                  where="sales-page.json"
                />
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="json" className="mt-10">
          <FileHeading id="json" name="settings/assessment.settings.json" />
          <pre
            tabIndex={0}
            className="mt-3 max-h-[30rem] overflow-auto rounded-xl border border-rule bg-white p-5 font-mono text-[0.82rem] leading-relaxed"
          >
            {json}
          </pre>
        </section>

        <section aria-labelledby="prompt" className="mt-10">
          <FileHeading id="prompt" name={`settings/${settings.promptFile}`} />
          <p className="mt-2 text-stone">
            An invented stand-in, shown here because it is a sample. In the real build this file is your finished prompt,
            unchanged, it stays on the server, and a page like this one sits behind the owner&apos;s sign-in.
          </p>
          <pre
            tabIndex={0}
            className="mt-3 max-h-[30rem] overflow-auto rounded-xl border border-rule bg-white p-5 font-mono text-[0.82rem] leading-relaxed whitespace-pre-wrap"
          >
            {prompt}
          </pre>
        </section>

        <section aria-labelledby="sales" className="mt-10">
          <FileHeading id="sales" name="settings/sales-page.json" />
          <p className="mt-2 text-stone">
            This is the text of the home page: the headline, the three steps, the pricing labels and the privacy
            paragraph. Change a sentence here and the sales page changes; the layout stays as designed.
          </p>
          <pre
            tabIndex={0}
            className="mt-3 max-h-[30rem] overflow-auto rounded-xl border border-rule bg-white p-5 font-mono text-[0.82rem] leading-relaxed whitespace-pre-wrap"
          >
            {sales}
          </pre>
        </section>
      </main>
    </>
  );
}

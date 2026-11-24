import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { formatPrice, settings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings file" };

function read(name: string): string {
  return readFileSync(path.join(process.cwd(), "settings", name), "utf8");
}

function Row({ label, value, where }: { label: string; value: React.ReactNode; where: string }) {
  return (
    <tr className="border-b border-rule last:border-b-0">
      <th scope="row" className="py-3 pr-4 text-left align-top font-semibold">
        {label}
      </th>
      <td className="py-3 pr-4 align-top">{value}</td>
      <td className="py-3 align-top font-mono text-[0.8rem] text-stone">{where}</td>
    </tr>
  );
}

/** Read-only view of the files the owner would edit. Rendered when the site is built, from the files themselves. */
export default function SettingsPage() {
  const json = read("assessment.settings.json");
  const prompt = read(settings.promptFile);
  const { model, prices, assessment, parts, reportJob } = settings;

  return (
    <>
      <SiteHeader variant="owner" current="/settings" />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <p className="eyebrow">Settings file</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight font-semibold tracking-tight">
          The prompt and the model, kept out of the code
        </h1>
        <p className="mt-4 max-w-3xl text-lg">
          Everything the owner is likely to change lives in two plain files in a <span className="font-mono text-base">settings</span>{" "}
          folder. The app reads them; nothing else needs touching. This page shows them as they are right now, read-only.
        </p>

        <section aria-labelledby="change" className="mt-8 rounded-xl bg-sand p-5 sm:p-6">
          <h2 id="change" className="font-serif text-xl font-semibold">
            How you would change one
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.98rem]">
            <li>Open the file in your code repository in the browser and click the pencil.</li>
            <li>Change the value: a model name, a price, or paste a new prompt.</li>
            <li>Press Commit. The host rebuilds the site and the change is live in about a minute.</li>
          </ol>
          <p className="mt-3 text-sm text-stone">
            The prompt is its own text file so it can be pasted in as written, with no quoting or escaping. If the
            settings file is saved with a mistake in its format, the build fails and the live site stays on the last
            good version.
          </p>
        </section>

        <section aria-labelledby="values" className="mt-10">
          <h2 id="values" className="font-serif text-2xl font-semibold">
            What the app is reading right now
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-white px-5" tabIndex={0} role="region" aria-label="Current settings">
            <table className="w-full min-w-[36rem] border-collapse text-[0.95rem]">
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
                  value={`${assessment.timeLimitDays} days from the first answer; a reopened session gets ${assessment.reopenDays} more`}
                  where="assessment.timeLimitDays, reopenDays"
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
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="json" className="mt-10">
          <h2 id="json" className="font-serif text-2xl font-semibold">
            <span className="font-mono text-xl">settings/assessment.settings.json</span>
          </h2>
          <pre
            tabIndex={0}
            className="mt-3 max-h-[30rem] overflow-auto rounded-xl border border-rule bg-white p-5 font-mono text-[0.82rem] leading-relaxed"
          >
            {json}
          </pre>
        </section>

        <section aria-labelledby="prompt" className="mt-10">
          <h2 id="prompt" className="font-serif text-2xl font-semibold">
            <span className="font-mono text-xl">settings/{settings.promptFile}</span>
          </h2>
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
      </main>
    </>
  );
}

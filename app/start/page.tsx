import { Clock, ListOrdered, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlowShell } from "@/components/flow-shell";
import { StartForm } from "@/components/start-form";
import { RETENTION_DAYS } from "@/lib/sandbox-ref";
import { currentSession } from "@/lib/server/context";
import { pathFor } from "@/lib/server/views";
import { settings } from "@/lib/settings";

export const metadata: Metadata = { title: "Before you begin" };

export default async function StartPage() {
  const located = await currentSession();
  if (!located) redirect("/code");
  if (located.status !== "not_started") redirect(pathFor(located.status));
  const { assessment, parts } = settings;

  return (
    <FlowShell>
      <p className="eyebrow">{assessment.name}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight">Before you begin</h1>
      <p className="mt-3 text-lg">
        Find somewhere you won&apos;t be hurried. Answer in your own words, as honestly as you can; nobody is grading
        this.
      </p>

      <ul className="mt-7 space-y-3.5 text-[1.02rem]">
        <li className="flex gap-3">
          <Clock aria-hidden className="mt-1 size-5 shrink-0 text-pine" />
          <span>
            <strong>
              About {assessment.minutesLow} to {assessment.minutesHigh} minutes.
            </strong>{" "}
            Longer if you like to think things through.
          </span>
        </li>
        <li className="flex gap-3">
          <ListOrdered aria-hidden className="mt-1 size-5 shrink-0 text-pine" />
          <span>
            <strong>{parts.length} parts, one question at a time.</strong> Type, or tap the microphone on your keyboard
            and speak. You can edit each answer until you continue.
          </span>
        </li>
        <li className="flex gap-3">
          <RotateCcw aria-hidden className="mt-1 size-5 shrink-0 text-pine" />
          <span>
            <strong>You can stop and come back with the same code.</strong> Every answer is saved as you go, so a lost
            signal or a flat battery costs you nothing.
          </span>
        </li>
      </ul>

      <section aria-labelledby="answers-heading" className="mt-8 rounded-xl bg-sand p-5 sm:p-6">
        <h2 id="answers-heading" className="font-serif text-xl font-semibold">
          What happens to your answers
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.95rem]">
          <li>They are stored encrypted, under your access code. There is no account and no password.</li>
          <li>They are used to ask your next question and to write your report, and for nothing else.</li>
          <li>
            The owner can see that your session exists and how far along it is. Reading what you wrote takes a
            deliberate step, and each time is recorded.
          </li>
          <li>
            You can delete your answers and report yourself, from the report page. In this sample everything is also
            removed automatically after {RETENTION_DAYS} days.
          </li>
        </ul>
      </section>

      <div className="mt-8">
        <StartForm />
      </div>

      <p className="mt-8 border-t border-rule pt-5 text-sm text-stone">
        About this sample: it is shortened to two questions in each part, so it takes about five minutes. The minutes
        shown along the way are those of the full assessment.
      </p>
    </FlowShell>
  );
}

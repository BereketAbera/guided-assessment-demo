import Link from "next/link";
import type { ReactNode } from "react";

const steps: { title: string; body: ReactNode }[] = [
  {
    title: "Stop, and resume on another device",
    body: (
      <>
        <Link href="/#buy" className="link">
          Buy a code
        </Link>
        , answer two questions and tap <strong>Take a break</strong>. Then{" "}
        <Link href="/code" className="link">
          enter the same code
        </Link>{" "}
        in a private window or on your phone: you are on the same question, with both answers kept.
      </>
    ),
  },
  {
    title: "Refresh during the wait",
    body: (
      <>
        Finish with the example answers, then refresh during <strong>Preparing your results</strong>, or close the tab
        and enter the code again: the same stage comes back, and then the report.
      </>
    ),
  },
  {
    title: "Look for the answers as the owner",
    body: (
      <>
        Open the{" "}
        <Link href="/admin" className="link">
          Owner admin
        </Link>
        . Your session is listed with its status and cost, and without its answers. Open its transcript with a reason,
        and find that in the access log.
      </>
    ),
  },
  {
    title: "Delete, then try the code",
    body: (
      <>
        On the report, choose <strong>Delete my answers</strong>. Press Back, and{" "}
        <Link href="/code" className="link">
          enter the code
        </Link>{" "}
        again: nothing is left to open.
      </>
    ),
  },
];

/** What a visitor with five minutes should try: the four things this sample was built to show. */
export function TryIt({ headingLevel = "h2" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/60 p-6 sm:p-7">
      <p className="eyebrow">About this sample</p>
      <Heading className="mt-1 font-serif text-2xl font-semibold tracking-tight">Try it in five minutes</Heading>
      <p className="mt-1.5 max-w-3xl text-[0.95rem] text-stone">
        Four things this sample was built to show. Short on time? After any purchase, the Demo inbox at the top of the
        page holds a ready-made code that is already at part 3.
      </p>
      <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[1.75rem_1fr] gap-x-2.5 lg:block">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-full bg-pine text-sm font-semibold text-white"
            >
              {i + 1}
            </span>
            <div className="lg:mt-2.5">
              <p className="leading-snug font-semibold">{step.title}</p>
              <p className="mt-1 text-[0.93rem]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

import Link from "next/link";
import { DemoInbox } from "./demo-inbox";

/** Always visible: says this is a sample, what is simulated, and holds the demo inbox. */
export function SampleRibbon() {
  return (
    <aside aria-label="About this sample" className="no-print border-b border-rule bg-sand text-[0.8125rem]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 px-5 sm:px-8 lg:flex-nowrap">
        <p className="shrink-0 font-semibold tracking-wide text-ink uppercase">
          <span className="sm:hidden">Sample</span>
          <span className="hidden sm:inline">Working sample</span>
        </p>
        <div className="flex shrink-0 items-center gap-1 lg:order-3">
          <DemoInbox />
          <Link
            href="/how-it-works"
            className="inline-flex min-h-9 items-center rounded-md px-2 font-semibold text-pine hover:bg-paper pointer-coarse:min-h-11"
          >
            How it works
          </Link>
        </div>
        {/* Its own line on a phone or tablet, so the sentence is never cut short. */}
        <p className="w-full pb-2 leading-snug text-stone lg:order-2 lg:w-auto lg:flex-1 lg:pb-0">
          Fictional assessment, simulated guide, no real payment.{" "}
          <Link href="/#try" className="link whitespace-nowrap">
            Four things to try
          </Link>
        </p>
      </div>
    </aside>
  );
}

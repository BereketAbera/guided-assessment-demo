import Link from "next/link";
import { DemoInbox } from "./demo-inbox";

/** Always visible: says this is a sample, and holds the demo inbox. */
export function SampleRibbon() {
  return (
    <div className="no-print border-b border-rule bg-sand text-[0.8125rem]">
      <div className="mx-auto flex min-h-10 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <p className="min-w-0 truncate text-stone">
          <span className="font-semibold tracking-wide text-ink uppercase">
            <span className="sm:hidden">Sample</span>
            <span className="hidden sm:inline">Working sample</span>
          </span>
          <span className="hidden md:inline"> · fictional assessment, simulated guide, no real payment</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <DemoInbox />
          <Link href="/how-it-works" className="inline-flex min-h-9 items-center rounded-md px-2 font-semibold text-pine hover:bg-paper">
            How it works
          </Link>
        </div>
      </div>
    </div>
  );
}

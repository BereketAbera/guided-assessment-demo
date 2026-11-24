import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "./brand-mark";

const ownerLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/admin", label: "Owner admin" },
  { href: "/settings", label: "Settings file" },
];

/** Customer pages get a quiet header; the pages about the build get their own navigation. */
export function SiteHeader({
  variant = "quiet",
  action,
  current,
}: {
  variant?: "quiet" | "sales" | "owner";
  action?: ReactNode;
  current?: string;
}) {
  return (
    <header className="no-print border-b border-rule">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 sm:px-8">
        <Link href="/" aria-label="Slate & Pine, sample home" className="rounded-md py-2">
          <Wordmark />
        </Link>
        {variant === "owner" ? (
          <nav aria-label="About this sample" className="-mx-2 flex flex-wrap items-center text-sm">
            {ownerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current === item.href ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-stone hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-clay aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {variant === "sales" ? (
          <nav aria-label="Main" className="-mx-2 flex items-center text-sm">
            <Link href="/sample-report" className="hidden min-h-11 items-center rounded-md px-3 font-medium text-stone hover:text-ink sm:inline-flex">
              Sample report
            </Link>
            <Link href="/code" className="inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-pine hover:text-pine-deep">
              I have a code
            </Link>
          </nav>
        ) : null}
        {action}
      </div>
    </header>
  );
}

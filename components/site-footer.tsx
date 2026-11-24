import Link from "next/link";
import { ResetDemo } from "./reset-demo";

const links = [
  { href: "/", label: "Sales page" },
  { href: "/code", label: "Enter a code" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/admin", label: "Owner admin" },
  { href: "/settings", label: "Settings file" },
];

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 border-t border-rule bg-sand/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 text-sm sm:px-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-semibold text-ink">Sample by Bereket A. · fictional data</p>
          <p className="mt-2 max-w-xl text-stone">
            The assessment, the names and the report text are invented. The guide is simulated with scripted
            reflections and rules, no payment is taken, and emails land in the demo inbox on this page instead of
            being sent.
          </p>
          <div className="mt-4">
            <ResetDemo />
          </div>
        </div>
        <nav aria-label="Sample pages">
          <ul className="grid grid-cols-2 gap-x-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center text-stone underline-offset-4 hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

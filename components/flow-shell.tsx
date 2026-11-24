import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";

/** The quiet frame for the customer's journey: a narrow, centred column and little else. */
export function FlowShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className={wide ? "flex-1 px-5 py-8 sm:px-8 sm:py-12" : "mx-auto w-full max-w-[36rem] flex-1 px-5 py-10 sm:py-16"}>
        {children}
      </main>
    </>
  );
}

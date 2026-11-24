"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { refreshInbox } from "./demo-inbox";
import { Button } from "./ui/button";

type Offer = { id: "single" | "twoPack"; name: string; blurb: string; price: string; each?: string };
type Bought = { pack: Offer["id"]; codes: string[] };

/** Simulated checkout. The real product hands this step to the payment provider's hosted page. */
export function Purchase({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [bought, setBought] = useState<Bought | null>(null);
  const [error, setError] = useState<string | null>(null);
  const result = useRef<HTMLDivElement>(null);

  // The confirmation appears in the card that was tapped. Bring it fully into view and move focus to it,
  // so a phone shows the code without scrolling and a screen reader hears it.
  useEffect(() => {
    if (!bought || !result.current) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    result.current.focus({ preventScroll: true });
    result.current.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
  }, [bought]);

  async function buy(pack: Offer["id"]) {
    setBusy(pack);
    setError(null);
    const response = await postJson<{ codes: string[] }>("/api/purchase", { pack });
    setBusy(null);
    if (!response.ok) {
      setError(response.offline ? "We couldn't reach the server. Try again in a moment." : response.message);
      return;
    }
    setBought({ pack, codes: response.data.codes });
    refreshInbox();
  }

  function enter(code: string) {
    try {
      window.sessionStorage.setItem("ga:prefill", code);
    } catch {
      // Without storage the visitor types the code.
    }
    router.push("/code");
  }

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        {offers.map((offer) => {
          const mine = bought?.pack === offer.id ? bought : null;
          return (
            <div key={offer.id} className="flex flex-col rounded-xl border border-rule bg-white p-6 sm:p-7">
              <h3 className="font-serif text-2xl font-semibold">{offer.name}</h3>
              <p className="mt-1 text-stone">{offer.blurb}</p>
              <p className="mt-auto flex items-baseline gap-2 pt-5">
                <span className="font-serif text-5xl font-semibold tracking-tight">{offer.price}</span>
                {offer.each ? <span className="text-sm text-stone">{offer.each}</span> : null}
              </p>

              {mine ? (
                <div
                  ref={result}
                  tabIndex={-1}
                  role="status"
                  className="mt-6 scroll-mt-6 rounded-lg border border-pine bg-paper p-4 outline-none"
                  data-testid="purchase-result"
                >
                  <p className="flex items-start gap-2 font-semibold">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pine text-white">
                      <Check aria-hidden className="size-3.5" />
                    </span>
                    <span>
                      Payment simulated. {mine.codes.length === 2 ? "Here are your two codes." : "Here is your code."}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-stone">
                    The real product emails {mine.codes.length === 2 ? "them" : "it"} within a minute or two of checkout.
                    Here, {mine.codes.length === 2 ? "they are" : "it is"} also in the Demo inbox at the top of the page.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {mine.codes.map((code) => (
                      <li key={code} className="rounded-md bg-sand px-3 py-2.5">
                        <p className="font-mono text-xl font-semibold tracking-[0.14em]" data-testid="issued-code">
                          {code}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => enter(code)}>
                            Enter this code
                          </Button>
                          <CopyButton value={code} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Button
                className="mt-6 w-full"
                size={mine ? "md" : "lg"}
                variant={bought ? "secondary" : "primary"}
                onClick={() => buy(offer.id)}
                disabled={busy !== null}
              >
                {busy === offer.id ? "Simulating payment…" : `Buy ${bought ? "another " : ""}${offer.name.toLowerCase()}`}
              </Button>
              <p className="mt-2 text-center text-xs text-stone">Simulated. No card is asked for and nothing is charged.</p>
            </div>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-lg border border-clay bg-white p-4 text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

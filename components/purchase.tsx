"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/utils";
import { refreshInbox } from "./demo-inbox";
import { Button } from "./ui/button";

type Offer = { id: "single" | "twoPack"; name: string; blurb: string; price: string; each?: string };

/** Simulated checkout. The real product hands this step to the payment provider's hosted page. */
export function Purchase({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(pack: Offer["id"]) {
    setBusy(pack);
    setError(null);
    const result = await postJson<{ codes: string[] }>("/api/purchase", { pack });
    setBusy(null);
    if (!result.ok) {
      setError(result.offline ? "We couldn't reach the server. Try again in a moment." : result.message);
      return;
    }
    setCodes(result.data.codes);
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
      <div className="grid max-w-4xl gap-5 md:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id} className="flex flex-col rounded-xl border border-rule bg-white p-6 sm:p-7">
            <h3 className="font-serif text-2xl font-semibold">{offer.name}</h3>
            <p className="mt-1 text-stone">{offer.blurb}</p>
            <p className="mt-auto flex items-baseline gap-2 pt-5">
              <span className="font-serif text-5xl font-semibold tracking-tight">{offer.price}</span>
              {offer.each ? <span className="text-sm text-stone">{offer.each}</span> : null}
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => buy(offer.id)} disabled={busy !== null}>
              {busy === offer.id ? "Simulating payment…" : `Buy ${offer.name.toLowerCase()}`}
            </Button>
            <p className="mt-2 text-center text-xs text-stone">Simulated. No card is asked for and nothing is charged.</p>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="mt-5 max-w-4xl">
        {error ? (
          <p role="alert" className="rounded-lg border border-clay bg-white p-4 text-sm font-medium">
            {error}
          </p>
        ) : null}
        {codes ? (
          <div className="rounded-xl border border-pine bg-white p-5 sm:p-6" data-testid="purchase-result">
            <p className="flex items-center gap-2 font-semibold">
              <span className="flex size-6 items-center justify-center rounded-full bg-pine text-white">
                <Check aria-hidden className="size-4" />
              </span>
              Payment simulated. {codes.length === 2 ? "Your two codes are" : "Your code is"} in the Demo inbox.
            </p>
            <p className="mt-1 text-sm text-stone">
              The real product emails {codes.length === 2 ? "them" : "it"} within a minute or two of checkout.
            </p>
            <ul className="mt-4 space-y-2">
              {codes.map((code) => (
                <li key={code} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-sand px-4 py-3">
                  <span className="font-mono text-xl font-semibold tracking-[0.14em]" data-testid="issued-code">
                    {code}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => enter(code)}>
                    Enter this code
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

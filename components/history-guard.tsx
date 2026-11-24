"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Pages that show one person's session, or the owner's view of the sessions. */
const PRIVATE = /^\/(session|report|preparing|start|admin)(\/|$)/;

/**
 * A page brought back by the Back or Forward button is checked against the
 * server again before it is trusted: a deleted report or a session closed on
 * this device must not reappear from the browser's memory.
 */
export function HistoryGuard() {
  const router = useRouter();
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      // Restored whole from the browser's back-forward cache: load it again.
      if (event.persisted) window.location.reload();
    };
    const onPop = () => {
      if (PRIVATE.test(window.location.pathname)) window.setTimeout(() => router.refresh(), 0);
    };
    window.addEventListener("pageshow", onShow);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("popstate", onPop);
    };
  }, [router]);
  return null;
}

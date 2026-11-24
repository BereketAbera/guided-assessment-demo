import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Conversation } from "@/components/conversation";
import { SiteHeader } from "@/components/site-header";
import { TakeBreak } from "@/components/take-break";
import { currentSession } from "@/lib/server/context";
import { conversationView, pathFor } from "@/lib/server/views";
import { settings } from "@/lib/settings";

export const metadata: Metadata = { title: "Your assessment" };

export default async function SessionPage() {
  const located = await currentSession();
  if (!located) redirect("/code");
  if (located.status !== "in_progress") redirect(pathFor(located.status));
  const view = conversationView(located);
  // Only the part titles go to the browser. The rest of the settings file (model, prices) stays here.
  const parts = settings.parts.map((part) => ({ id: part.id, title: part.title }));

  return (
    <>
      <SiteHeader action={<TakeBreak sessionId={view.sessionId} codeStart={view.codeHint.slice(0, 4)} />} />
      <Conversation initial={view} parts={parts} />
    </>
  );
}

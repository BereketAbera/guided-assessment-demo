import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Conversation } from "@/components/conversation";
import { currentSession } from "@/lib/server/context";
import { conversationView, pathFor } from "@/lib/server/views";

export const metadata: Metadata = { title: "Your assessment" };

export default async function SessionPage() {
  const located = await currentSession();
  if (!located) redirect("/code");
  if (located.status !== "in_progress") redirect(pathFor(located.status));
  const view = conversationView(located);

  return (
    <Conversation initial={view} />
  );
}

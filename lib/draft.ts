/**
 * The answer being written is kept on the device until it is sent, so a
 * dropped connection, a reload or a dead battery does not lose it. Sent
 * answers live on the server; drafts never leave the browser.
 */
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function draftKey(sessionId: string, questionId: string): string {
  return `ga:draft:${sessionId}:${questionId}`;
}

export function loadDraft(storage: DraftStorage, sessionId: string, questionId: string): string {
  try {
    return storage.getItem(draftKey(sessionId, questionId)) ?? "";
  } catch {
    return "";
  }
}

/** Saving an empty draft removes it, so nothing stale comes back later. */
export function saveDraft(storage: DraftStorage, sessionId: string, questionId: string, text: string): void {
  try {
    if (text.length === 0) storage.removeItem(draftKey(sessionId, questionId));
    else storage.setItem(draftKey(sessionId, questionId), text);
  } catch {
    // Storage full or blocked: the draft stays in the page for as long as it is open.
  }
}

export function clearDraft(storage: DraftStorage, sessionId: string, questionId: string): void {
  try {
    storage.removeItem(draftKey(sessionId, questionId));
  } catch {
    // Nothing to clear.
  }
}

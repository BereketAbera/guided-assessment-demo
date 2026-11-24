import "server-only";
import { createHash } from "node:crypto";
import { BlobError, BlobPreconditionFailedError, del, get, list, put } from "@vercel/blob";

/**
 * A very small document store: JSON bodies by key, with conditional writes.
 *
 * - On Vercel it is a private Blob store in the same account (no third-party
 *   service). Reads bypass the cache, so a write is visible to the next read.
 * - Locally and in tests it is a map in memory.
 *
 * Production for the real product would be Postgres; this interface is the
 * part of it the sample needs.
 */
export type StoredDoc = { body: string; etag: string };
export type ListedDoc = { key: string; uploadedAt: number };

export class StoreConflict extends Error {
  constructor() {
    super("The document changed since it was read.");
    this.name = "StoreConflict";
  }
}

export interface DocStore {
  get(key: string): Promise<StoredDoc | null>;
  /** With ifMatch: replace only that version. Without: create, and fail if the key exists. */
  put(key: string, body: string, ifMatch?: string): Promise<{ etag: string }>;
  del(keys: string[]): Promise<void>;
  list(prefix: string): Promise<ListedDoc[]>;
}

export function usesBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.GA_STORE !== "memory";
}

type MemoryEntry = StoredDoc & { uploadedAt: number };
const globalStore = globalThis as typeof globalThis & { __gaMemoryStore?: Map<string, MemoryEntry> };

export function memoryStore(map?: Map<string, MemoryEntry>): DocStore {
  const data = map ?? (globalStore.__gaMemoryStore ??= new Map<string, MemoryEntry>());
  const etagOf = (body: string) => createHash("sha1").update(body + Math.random()).digest("hex");
  return {
    async get(key) {
      const entry = data.get(key);
      return entry ? { body: entry.body, etag: entry.etag } : null;
    },
    async put(key, body, ifMatch) {
      const current = data.get(key);
      if (ifMatch === undefined ? current !== undefined : current?.etag !== ifMatch) throw new StoreConflict();
      const etag = etagOf(body);
      data.set(key, { body, etag, uploadedAt: Date.now() });
      return { etag };
    },
    async del(keys) {
      for (const key of keys) data.delete(key);
    },
    async list(prefix) {
      return [...data.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, entry]) => ({ key, uploadedAt: entry.uploadedAt }));
    },
  };
}

function blobStore(): DocStore {
  const options = { access: "private" as const, contentType: "application/json", addRandomSuffix: false };
  return {
    async get(key) {
      const found = await get(key, { access: "private", useCache: false });
      if (!found || found.statusCode !== 200) return null;
      return { body: await new Response(found.stream).text(), etag: found.blob.etag };
    },
    async put(key, body, ifMatch) {
      try {
        const written = await put(key, body, ifMatch === undefined ? options : { ...options, ifMatch });
        return { etag: written.etag };
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) throw new StoreConflict();
        if (error instanceof BlobError && /already exists/i.test(error.message)) throw new StoreConflict();
        throw error;
      }
    },
    async del(keys) {
      if (keys.length > 0) await del(keys);
    },
    async list(prefix) {
      const out: ListedDoc[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix, cursor, limit: 1000 });
        for (const blob of page.blobs) out.push({ key: blob.pathname, uploadedAt: blob.uploadedAt.getTime() });
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      return out;
    },
  };
}

let chosen: DocStore | null = null;
export function getStore(): DocStore {
  if (!chosen) chosen = usesBlobStore() ? blobStore() : memoryStore();
  return chosen;
}

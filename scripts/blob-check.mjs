// Checks that the Blob store gives read-your-writes for overwrites and honours conditional writes.
// Usage: node --env-file=.env.local scripts/blob-check.mjs
import { put, get, del, BlobPreconditionFailedError } from "@vercel/blob";

const key = `ga1/check/${Date.now()}.json`;
const read = async () => {
  const t = Date.now();
  const r = await get(key, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return { body: null, ms: Date.now() - t };
  const body = await new Response(r.stream).text();
  return { body, etag: r.blob.etag, ms: Date.now() - t };
};

let t = Date.now();
const first = await put(key, JSON.stringify({ n: 0 }), { access: "private", contentType: "application/json", addRandomSuffix: false });
console.log("put #0", Date.now() - t, "ms", first.etag);
let etag = first.etag;
let stale = 0;
for (let n = 1; n <= 6; n++) {
  t = Date.now();
  const w = await put(key, JSON.stringify({ n }), { access: "private", contentType: "application/json", addRandomSuffix: false, ifMatch: etag });
  const putMs = Date.now() - t;
  const r = await read();
  const got = r.body ? JSON.parse(r.body).n : null;
  if (got !== n || r.etag !== w.etag) stale++;
  console.log(`put #${n} ${putMs} ms, get ${r.ms} ms, read n=${got}, etag match=${r.etag === w.etag}`);
  etag = w.etag;
}
try {
  await put(key, "{}", { access: "private", contentType: "application/json", addRandomSuffix: false, ifMatch: first.etag });
  console.log("conditional write with an old etag: ACCEPTED (unexpected)");
} catch (e) {
  console.log("conditional write with an old etag rejected:", e instanceof BlobPreconditionFailedError);
}
const missing = await get(`ga1/check/none-${Date.now()}.json`, { access: "private", useCache: false });
console.log("missing blob returns", missing);
await del(key);
console.log("stale reads:", stale);

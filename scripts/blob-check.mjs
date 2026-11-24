// Checks that the Blob store gives read-your-writes for overwrites and honours conditional writes,
// with a document of realistic size. Usage: node --env-file=.env.blob scripts/blob-check.mjs [content-type]
import { put, get, del, BlobPreconditionFailedError } from "@vercel/blob";

const contentType = process.argv[2] ?? "application/json";
const key = `ga1/check/${Date.now()}.json`;
const filler = "lorem ipsum dolor sit amet ".repeat(1200);
const body = (n) => JSON.stringify({ n, filler });
const options = { access: "private", contentType, addRandomSuffix: false };

const read = async () => {
  const started = Date.now();
  const found = await get(key, { access: "private", useCache: false });
  if (!found || found.statusCode !== 200) return { n: null, ms: Date.now() - started };
  const text = await new Response(found.stream).text();
  // A compressed response carries a weak validator (W/"…"); the store compares the strong form.
  const etag = found.blob.etag.replace(/^W\//, "");
  return { n: JSON.parse(text).n, etag, raw: found.blob.etag, ms: Date.now() - started, encoding: found.headers.get("content-encoding") };
};

console.log("content type:", contentType, "| body bytes:", body(0).length);
const first = await put(key, body(0), options);
console.log("created, etag from put:", first.etag);
let failures = 0;
for (let n = 1; n <= 4; n++) {
  const before = await read();
  try {
    const written = await put(key, body(n), { ...options, ifMatch: before.etag });
    const after = await read();
    const fresh = after.n === n && after.etag === written.etag;
    if (!fresh) failures++;
    console.log(`#${n} etag read ${before.raw} (encoding ${before.encoding}) -> conditional write ok, read back n=${after.n}, fresh=${fresh}, get ${after.ms} ms`);
  } catch (error) {
    failures++;
    console.log(`#${n} etag read ${before.raw} (encoding ${before.encoding}) -> conditional write FAILED:`, error instanceof BlobPreconditionFailedError ? "precondition" : error.message);
  }
}
try {
  await put(key, body(99), { ...options, ifMatch: first.etag });
  failures++;
  console.log("write with a stale etag: ACCEPTED (unexpected)");
} catch (error) {
  console.log("write with a stale etag rejected:", error instanceof BlobPreconditionFailedError);
}
await del(key);
console.log(failures === 0 ? "OK" : `PROBLEMS: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;

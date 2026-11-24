// Looks at what is actually stored: every sandbox document is fetched with the server token and searched
// for text that must never be there in the clear. Also confirms the store refuses a request without the token.
// Usage: node --env-file=.env.blob scripts/stored-check.mjs
import { get, list } from "@vercel/blob";

const forbidden = ["notebook", "Maren", "Noor", "Tobias", "Dana", "Deliberate Starter", "key statement"];
const { blobs } = await list({ prefix: "ga1/sb/" });
let problems = 0;
for (const blob of blobs) {
  const found = await get(blob.pathname, { access: "private", useCache: false });
  const text = await new Response(found.stream).text();
  const doc = JSON.parse(text);
  const hits = forbidden.filter((word) => text.includes(word));
  const sealed = doc.sessions.filter((s) => s.sealed).length;
  if (hits.length > 0) problems++;
  console.log(`${blob.pathname.slice(0, 22)}… ${text.length} bytes, ${doc.sessions.length} sessions (${sealed} with sealed answers), plain-text hits: ${hits.length ? hits.join(", ") : "none"}`);
  const anonymous = await fetch(blob.url);
  if (anonymous.ok) problems++;
  console.log(`  same URL without the token: HTTP ${anonymous.status}`);
}
console.log(blobs.length === 0 ? "nothing stored" : problems === 0 ? "OK" : `PROBLEMS: ${problems}`);
process.exitCode = problems === 0 ? 0 : 1;

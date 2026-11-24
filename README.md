# Guided assessment: a working sample

A sample of the app around a paid, guided self-assessment: a buyer gets an access code, works through a
conversation one question at a time, and receives a written report. Everything in it is fictional: the
assessment ("The Working Style Reflection"), the names and the report text.

**What is simulated.** The guide is scripted (reflections chosen by rules, one follow-up after a very short
answer); no language model is called. No payment is taken. No email is sent: codes and reports appear in a
"Demo inbox" panel. Token counts are estimated from text length.

**What is real, running code.** Saving after every answer, resuming with the code alone (including on another
device), a report job that outlives the page, a report built from labeled sections in one template, real
deletion, and an owner admin that lists sessions without reading answers.

## What it proves

| Question | Where to look |
| --- | --- |
| Does it feel like a product, not a chat window, on a phone? | `/session`: one question per screen, no bubbles, a plain textarea so the keyboard's dictation works |
| How do you resume after the phone dies? | Enter the same code on any device. `lib/server/repo.ts`, `lib/assessment/machine.ts` |
| How does a 1 to 2 minute report not time out or look frozen? | `/preparing`: a server-side job with named stages; the page only asks for its status. `lib/assessment/job.ts` |
| How are sensitive answers kept private? | Encrypted at rest, admin list built without them, transcript opening logged, "Delete my answers". `lib/server/crypto.ts`, `/admin` |
| Styled text or a template for the report? | A template filled from labeled sections; `/how-it-works` shows both side by side. `lib/report/`, `components/report/` |
| Can the owner change the prompt and model without code? | `settings/assessment.settings.json` and `settings/guide-prompt.md`, shown on `/settings` |

## Pages

`/` sales page with a simulated purchase · `/code` code entry · `/start` first name and what happens to your
answers · `/session` the conversation · `/preparing` the staged wait · `/report` the report, PDF and email copy,
delete · `/sample-report` · `/admin` and `/admin/sessions/[id]` · `/settings` · `/how-it-works`.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3601, data in memory
```

No environment variables are needed locally. Without `BLOB_READ_WRITE_TOKEN` the app keeps its data in memory
and uses a fixed development key, so nothing leaves the machine and a restart clears it.

## How state works

- **A private space per visitor.** The middleware gives each browser an unguessable reference in an http-only
  cookie. One JSON document per visitor holds that visitor's codes, sessions, demo inbox and access log, so
  visitors never see each other's data. "Reset demo" deletes the document.
- **A session has two halves.** The plain half (status, dates, token counts) runs the app and the admin list.
  The sealed half (first name, answers, report) is encrypted with AES-256-GCM using `DATA_KEY`, which exists
  only in the server environment.
- **Codes are not stored.** Only a keyed one-way hash and the first four characters are kept. A small pointer
  document per code maps the hash to its session, which is how a second device finds the session.
- **Every answer is one conditional write.** The server reads the document, applies the state machine, and
  writes it back only if nobody else wrote in between; otherwise it retries on the newer document. A repeated
  send of the same answer is recognised and ignored.
- **The answer being typed stays on the device** (`localStorage`) until it is sent, so a reload or a dropped
  connection does not lose it. It is not shared between devices.
- **The report job is a start time on the server.** Its stage is worked out from that time, so a refresh, a
  closed tab or another device all see the same stage. In production a worker would write the stage to a
  database; the page would read it the same way.
- **Where it is stored.** On Vercel: a private Blob store in the same account, read with the cache bypassed so
  a write is visible to the next read (`scripts/blob-check.mjs` checks this). Locally and in tests: memory.
  The real product would use Postgres with the same split.
- **Retention.** A daily cron (`/api/cron/purge`, protected by `CRON_SECRET`) removes each visitor's document
  seven days after the day it was created.

Environment variables on the host: `BLOB_READ_WRITE_TOKEN` (set by connecting the Blob store), `DATA_KEY`
(64 hex characters), `CRON_SECRET`.

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test           # unit: code format, state machine, staged job, report builder, sealing, store, deletion
pnpm build
pnpm test:e2e       # Playwright at 390x844 and 1440x900, with an accessibility check on every page
BASE_URL=https://… pnpm test:live     # two-device resume, the job, deletion and the admin on a deployment
BASE_URL=https://… SCREENS_DIR=… pnpm screens
```

The end-to-end suite covers the whole journey from a code to the report, resume after a reload and on a second
browser, a refresh and a closed page during "Preparing your results", "Delete my answers", an expired code
reopened by the owner, and an admin list that shows no transcript until one is opened.

## Not in this sample

Real checkout, real email and list sign-up, a server-rendered PDF file, refunds, beta mode with a feedback form
and exports, and the owner's own sign-in. `/how-it-works` says what the real build would use for each.

Sample by Bereket A. · fictional data

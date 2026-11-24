# Design notes

The look was set before the build: warm paper, ink text, pine for buttons and progress, clay for the key
statement, a book serif for questions and report headings, a plain sans for everything else. A later pass
checked the sample against that and found it already fit, so it made three changes, not four. Each one is
listed here with its reason.

## 1. A link preview and proper icons

- What: a 1200 x 630 preview picture (the mark, the name, the headline of the sales page, and the opening of
  the sample key statement beside its clay rule), a 180 px home-screen icon and a `favicon.ico`.
- Where: `app/opengraph-image.png` with its alt text, `app/apple-icon.png`, `app/favicon.ico`, beside the
  existing `app/icon.svg`. `app/layout.tsx` sets the site address, the Open Graph text and the large Twitter
  card. `middleware.ts` leaves these files out, so a service fetching the picture gets no visitor cookie.
- Why: the owner opens the link on a phone and may forward it to a partner or a tester. Before, a pasted link
  showed as a bare address and a saved bookmark as a blank tile. Now it arrives looking like the product.

## 2. One drawing of the report job

- What: the customer's phone and the server as two lines on one timeline. The phone's line stops when the
  phone drops out; the server's line carries on to "Report ready"; the same code opens the report later.
  Solid marks run in this sample, dashed ones are the real build only.
- Where: `/how-it-works#job`, after the paragraph that begins "The stronger reason is the phone". Beside the
  list on a wide screen, above it on a phone. The component is `components/diagrams/report-job.tsx`.
- Why: "the report takes one to two minutes; how does the page not freeze?" is the owner's own question, and
  this section is where it is answered. It was all prose. The drawing shows the one idea that matters, and
  says honestly which half this sample runs.
- Details: the labels are real text in the page's own font, never smaller than 12 px on a phone. The stage
  names come from the settings file. The drawing has a title and a full description for screen readers.

## 3. Type and thin rules in place of icon rows

- What: the three facts under the headline, and the three things to know on the start screen, are plain type
  with hairlines between them. Each resource on the report carries its kind as a small label in place of a
  repeated file icon. The eight "What you would own" entries have a plain rule, not a clay one.
- Where: `app/page.tsx`, `app/start/page.tsx`, `components/report/report-view.tsx`,
  `app/how-it-works/page.tsx`.
- Why: these were the only places that looked like any component library, and one icon (a lock beside "stop
  and come back") said the wrong thing. Clay now marks the key statement and little else, so it keeps its
  meaning.

## Fixes made in the same pass

- The Demo inbox count shows no number until it is known, and moves together with a purchase confirmation.
- After buying only a two-pack, the Single card still says "Buy single" and keeps its own height.
- On the settings page a key breaks between keys, never inside one.
- Wording: US spelling throughout, the profile summary names its two patterns as written below it, and the
  delete dialog uses the words on the button ("Save as PDF").
- Left alone: the page breaks of the printed report. Two smaller-gap variants were tried and each split
  something that belongs together, so the current breaks stay.

## Rebuilding the drawn assets

Everything drawn comes from the scripts in `design/` (Python 3, standard library only) and Inkscape 1.x.
Nothing is downloaded and no picture is traced.

    sh design/build.sh

- `design/brand.py`: the palette, the mark and the font choice.
- `design/make_brand_assets.py`: writes `app/icon.svg` and the preview picture as SVG, and packs `favicon.ico`.
  The preview text is set in the site's own fonts when they are installed, otherwise in the next family of
  the site's font stack.
- `design/make_job_diagram.py`: holds the rows of the drawing and writes the component and a plain SVG copy.
- `design/build.sh`: the exact Inkscape commands, and check pictures in `design/out/` to look at afterwards.

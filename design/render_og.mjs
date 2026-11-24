// Draws the link preview from its SVG with the site's own web fonts.
//
//     node design/render_og.mjs design/out/og.svg app/opengraph-image.png 1200
//
// The fonts are the latin files the site itself serves (Source Serif 4 and Inter, both under the SIL Open
// Font License), kept in design/fonts. If either file is missing, or the browser does not use it for the
// text, the script exits with an error and writes nothing: a fallback family must never ship unnoticed.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const [source, target, widthArg] = process.argv.slice(2);
if (!source || !target) {
  console.error("usage: node design/render_og.mjs <in.svg> <out.png> [width]");
  process.exit(2);
}
const width = Number(widthArg ?? 1200);
const height = Math.round((width * 630) / 1200);

const fonts = [
  { family: "Source Serif 4", file: "source-serif-4-latin.woff2", weight: "200 900" },
  { family: "Inter", file: "inter-latin.woff2", weight: "100 900" },
];

function stop(message) {
  console.error(`\nLINK PREVIEW NOT DRAWN: ${message}\n`);
  process.exit(1);
}

const faces = fonts
  .map(({ family, file, weight }) => {
    const at = path.join(here, "fonts", file);
    if (!existsSync(at)) stop(`design/fonts/${file} (${family}) is missing.`);
    const data = readFileSync(at).toString("base64");
    return `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${data}) format("woff2");}`;
  })
  .join("");

const svg = readFileSync(source, "utf8");
const html = `<!doctype html><meta charset="utf-8"><style>${faces}html,body{margin:0}svg{display:block;width:${width}px;height:${height}px}</style>${svg}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html);
  const loaded = await page.evaluate(async (families) => {
    const results = [];
    for (const family of families) {
      const got = await document.fonts.load(`700 40px "${family}"`, "Slate & Pine");
      results.push([family, got.length > 0 && document.fonts.check(`700 40px "${family}"`)]);
    }
    await document.fonts.ready;
    // Every piece of text must name one of the two families first.
    const stray = [...document.querySelectorAll("text")]
      .map((t) => getComputedStyle(t).fontFamily)
      .filter((f) => !families.some((family) => f.replaceAll('"', "").replaceAll("'", "").startsWith(family)));
    return { results, stray };
  }, fonts.map((f) => f.family));
  for (const [family, ok] of loaded.results) if (!ok) stop(`${family} did not load in the browser.`);
  if (loaded.stray.length) stop(`some text asks for another family: ${[...new Set(loaded.stray)].join(", ")}`);
  await page.screenshot({ path: target, clip: { x: 0, y: 0, width, height } });
  console.log(`wrote ${target} (${width} x ${height}) in ${fonts.map((f) => f.family).join(" and ")}`);
} finally {
  await browser.close();
}
